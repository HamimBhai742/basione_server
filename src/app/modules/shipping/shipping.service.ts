import { OrderStatus, QlsShipmentStatus } from "@prisma/client";
import httpStatus from "http-status";
import config from "../../../config";
import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import { sendDeliveredOrderReviewEmail } from "../../utils/orderReview";
import {
  qlsClient,
  QlsCreateShipmentPayload,
  QlsShipmentProduct,
} from "./qls.client";

type CreateShipmentPayload = {
  orderId: string;
  carrier?: QlsCarrierCode;
  productCombinationId?: number;
  brandId?: string;
  weight?: number;
  servicepointCode?: string;
  customsInvoiceNumber?: string;
  customsShipmentType?: "commercial" | "documents" | "return" | "sample";
  shipmentProducts?: QlsShipmentProduct[];
};

export type QlsCarrierCode = "dhl" | "dragonfly" | "dpd" | "postnl";

const supportedCarriers: Record<QlsCarrierCode, { code: QlsCarrierCode; label: string }> = {
  dhl: {
    code: "dhl",
    label: "DHL",
  },
  dragonfly: {
    code: "dragonfly",
    label: "Dragonfly",
  },
  dpd: {
    code: "dpd",
    label: "DPD",
  },
  postnl: {
    code: "postnl",
    label: "PostNL",
  },
};

const getSupportedCarriers = () => Object.values(supportedCarriers);

const isQlsCarrierCode = (carrier?: string): carrier is QlsCarrierCode => {
  return Boolean(carrier && carrier in supportedCarriers);
};

const getCarrierLabel = (carrier?: string) => {
  return isQlsCarrierCode(carrier) ? supportedCarriers[carrier].label : "QLS";
};

const resolveProductCombinationId = (
  carrier?: string,
  productCombinationId?: number,
) => {
  if (productCombinationId) {
    return productCombinationId;
  }

  if (!carrier) {
    return config.qls.defaultProductCombinationId;
  }

  if (!isQlsCarrierCode(carrier)) {
    throw new AppError("Niet-ondersteunde QLS-vervoerder geselecteerd", httpStatus.BAD_REQUEST);
  }

  const carrierProductCombinationId = config.qls.carriers[carrier];

  if (!carrierProductCombinationId) {
    throw new AppError(
      `QLS-productcombinatie-ID is niet geconfigureerd voor ${supportedCarriers[carrier].label}`,
      httpStatus.BAD_REQUEST,
    );
  }

  return carrierProductCombinationId;
};

const normalizeQlsStatus = (status?: string): QlsShipmentStatus => {
  const value = (status || "created") as QlsShipmentStatus;
  return Object.values(QlsShipmentStatus).includes(value)
    ? value
    : QlsShipmentStatus.created;
};

const getOrderStatusForShipmentStatus = (
  status: QlsShipmentStatus,
): OrderStatus | undefined => {
  if (status === QlsShipmentStatus.delivered) {
    return OrderStatus.delivered;
  }

  const shippedStatuses: QlsShipmentStatus[] = [
    QlsShipmentStatus.created,
    QlsShipmentStatus.printed,
    QlsShipmentStatus.pre_transit,
    QlsShipmentStatus.in_transit,
  ];

  if (shippedStatuses.includes(status)) {
    return OrderStatus.shipped;
  }

  return undefined;
};

const sanitize = (value?: string | null) => {
  return typeof value === "string" ? value.trim() : "";
};

const buildReference = (order: { id: string; trackingNumber?: string | null }) =>
  order.trackingNumber || order.id;

const buildReceiverContact = (order: any) => {
  const address = order.addresses;

  if (!address) {
    throw new AppError(
      "Verzendadres is vereist voor het maken van een QLS-verzending",
      httpStatus.BAD_REQUEST,
    );
  }

  return {
    name: sanitize(address.name),
    companyname: sanitize(address.companyName) || undefined,
    street: sanitize(address.street),
    housenumber: sanitize(address.houseNumber),
    address2: sanitize(address.address) || undefined,
    postalcode: sanitize(address.zipCode),
    locality: sanitize(address.city),
    country: config.qls.defaultCountry,
    email: sanitize(address.email) || sanitize(order.user?.email) || undefined,
    phone: sanitize(address.phone) || undefined,
  };
};

const removeUndefinedFields = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value));
};

const buildShipmentProducts = (order: any): QlsShipmentProduct[] => {
  const quantity = Number(order.quantity || 1);
  const weightPerUnit = order.weight
    ? Math.max(1, Math.round(Number(order.weight) / quantity))
    : undefined;

  return [{
    amount: Number(order.quantity || 1),
    name: `${order.banner?.name || order.banner?.occasion || "Custom"} Banner`,
    price_per_unit: Number(order.banner?.price || order.total || 0),
    weight_per_unit: weightPerUnit,
    currency: "EUR",
  }];
};

const persistShipmentResponse = async ({
  orderId,
  requestPayload,
  response,
  existingShipmentId,
}: {
  orderId: string;
  requestPayload?: unknown;
  response: any;
  existingShipmentId?: string;
}) => {
  const status = normalizeQlsStatus(response?.status);
  const orderStatus = getOrderStatusForShipmentStatus(status);
  const previousOrder =
    orderStatus === OrderStatus.delivered
      ? await prisma.order.findUnique({
          where: {
            id: orderId,
          },
          select: {
            status: true,
          },
        })
      : null;

  const shipmentData = {
    qlsShipmentId: response?.id,
    companyId: response?.company_id || config.qls.companyId,
    brandId: response?.brand_id || config.qls.brandId,
    productId: response?.product_id || null,
    productCombinationId:
      response?.product_combination_id ||
      (requestPayload as QlsCreateShipmentPayload | undefined)
        ?.product_combination_id ||
      config.qls.defaultProductCombinationId,
    reference: response?.reference || (requestPayload as any)?.reference || orderId,
    status,
    weight: response?.weight || (requestPayload as any)?.weight || null,
    barcode: response?.barcode || null,
    trackingId: response?.tracking_id || null,
    trackingUrl: response?.tracking_url || null,
    labelPdfUrl: response?.label_pdf_url || response?.label || null,
    labelZplUrl: response?.label_zpl_url || response?.label_zpl || null,
    servicepointCode: (requestPayload as any)?.servicepoint_code || null,
    rawRequest: requestPayload ? JSON.parse(JSON.stringify(requestPayload)) : undefined,
    rawResponse: JSON.parse(JSON.stringify(response || {})),
    lastError: null,
    lastSyncedAt: new Date(),
  };

  const shipment = await prisma.$transaction(async (tx) => {
    const savedShipment =
      existingShipmentId || response?.id
        ? await tx.qlsShipment.upsert({
            where: existingShipmentId
              ? { id: existingShipmentId }
              : { qlsShipmentId: response.id },
            update: shipmentData,
            create: {
              ...shipmentData,
              orderId,
            },
          })
        : await tx.qlsShipment.create({
            data: {
              ...shipmentData,
              orderId,
            },
          });

    await tx.qlsShipmentEvent.create({
      data: {
        shipmentId: savedShipment.id,
        orderId,
        eventType: "refresh",
        qlsStatus: response?.status || null,
        qlsShipmentId: response?.id || null,
        barcode: response?.barcode || null,
        trackingId: response?.tracking_id || null,
        payload: JSON.parse(JSON.stringify(response || {})),
      },
    });

    if (orderStatus) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: orderStatus,
        },
      });
    }

    return savedShipment;
  });

  if (
    orderStatus === OrderStatus.delivered &&
    previousOrder?.status !== OrderStatus.delivered
  ) {
    await sendDeliveredOrderReviewEmail(orderId);
  }

  return shipment;
};

const getShippingMethods = async () => {
  const methods = await qlsClient.getShippingMethods();
  return Array.isArray(methods) ? methods : methods?.data || [];
};

const getSetupCompanies = async () => {
  return qlsClient.getCompanies();
};

const getSetupBrands = async (companyId: string) => {
  return qlsClient.getBrands(companyId);
};

const getSetupProducts = async (companyId: string) => {
  return qlsClient.getProducts(companyId);
};

const getSetupProductCombinations = async (companyId: string) => {
  const products = await getSetupProducts(companyId);

  return (Array.isArray(products) ? products : []).flatMap((product: any) =>
    (product.combinations || []).map((combination: any) => ({
      productId: product.id,
      productName: product.name,
      productType: product.type,
      servicepoint: product.servicepoint,
      maxHeight: product.max_height,
      maxLength: product.max_length,
      maxWidth: product.max_width,
      combinationId: combination.id,
      combinationName: combination.name,
      productOptions: combination.product_options || [],
      pricing: product.pricing || [],
    })),
  );
};

const createShipment = async (payload: CreateShipmentPayload) => {
  if (payload.carrier && !isQlsCarrierCode(payload.carrier)) {
    throw new AppError("Niet-ondersteunde QLS-vervoerder geselecteerd", httpStatus.BAD_REQUEST);
  }

  const productCombinationId = resolveProductCombinationId(
    payload.carrier,
    payload.productCombinationId,
  );

  if (!productCombinationId) {
    throw new AppError(
      "QLS_DEFAULT_PRODUCT_COMBINATION_ID is vereist, of stuur productCombinationId",
      httpStatus.BAD_REQUEST,
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
    include: {
      user: true,
      banner: true,
      addresses: true,
      payment: true,
      shipments: true,
    },
  });

  if (!order) {
    throw new AppError("Bestelling niet gevonden", httpStatus.NOT_FOUND);
  }

  if (order.deliveryMethod === "pickup") {
    throw new AppError("Afhaalbestellingen hebben geen QLS-verzendlabels nodig");
  }

  if (order.paymentStatus !== "paid") {
    throw new AppError("Alleen betaalde bestellingen kunnen worden verzonden", httpStatus.BAD_REQUEST);
  }

  if (order.status !== "ready") {
    throw new AppError(
      "Alleen bestellingen die gereed zijn, kunnen QLS-verzendlabels laten maken",
      httpStatus.BAD_REQUEST,
    );
  }

  const existingShipment = order.shipments.find(
    (shipment) => shipment.status !== "failed",
  );

  if (existingShipment?.qlsShipmentId) {
    throw new AppError(
      "Er bestaat al een QLS-verzending voor deze bestelling",
      httpStatus.CONFLICT,
    );
  }

  const requestPayload: QlsCreateShipmentPayload = removeUndefinedFields({
    product_combination_id: productCombinationId,
    brand_id: payload.brandId || config.qls.brandId,
    servicepoint_code: payload.servicepointCode,
    reference: buildReference(order),
    weight: payload.weight || undefined,
    customs_invoice_number: payload.customsInvoiceNumber,
    customs_shipment_type: payload.customsShipmentType,
    receiver_contact: buildReceiverContact(order),
    shipment_products: payload.shipmentProducts || buildShipmentProducts(order),
  });
  const selectedCarrier = payload.carrier
    ? supportedCarriers[payload.carrier]
    : undefined;
  const requestPayloadForLog = selectedCarrier
    ? {
        ...requestPayload,
        carrier: selectedCarrier,
      }
    : requestPayload;
  const response = await qlsClient.createShipment(requestPayload);

  const shipment = await persistShipmentResponse({
    orderId: order.id,
    requestPayload: requestPayloadForLog,
    response,
    existingShipmentId: existingShipment?.id,
  });

  await prisma.qlsShipmentEvent.create({
    data: {
      shipmentId: shipment.id,
      orderId: order.id,
      eventType: "created",
      qlsStatus: response?.status || null,
      qlsShipmentId: response?.id || null,
      barcode: response?.barcode || null,
      trackingId: response?.tracking_id || null,
      payload: JSON.parse(
        JSON.stringify({
          carrier: selectedCarrier,
          response: response || {},
        }),
      ),
    },
  });

  return shipment;
};

const getOrderShipment = async (orderId: string, user?: any) => {
  const where: any = {
    id: orderId,
  };

  if (user?.role !== "admin") {
    where.userId = user?.id;
  }

  const order = await prisma.order.findFirst({
    where,
    include: {
      shipments: {
        include: {
          events: {
            orderBy: {
              receivedAt: "desc",
            },
            take: 20,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Bestelling niet gevonden", httpStatus.NOT_FOUND);
  }

  return order.shipments;
};

const refreshShipment = async (orderId: string, user?: any) => {
  const where: any = {
    id: orderId,
  };

  if (user?.role !== "admin") {
    where.userId = user?.id;
  }

  const order = await prisma.order.findFirst({
    where,
    include: {
      shipments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!order) {
    throw new AppError("Bestelling niet gevonden", httpStatus.NOT_FOUND);
  }

  const shipment = order.shipments[0];

  if (!shipment?.qlsShipmentId) {
    throw new AppError("QLS-verzending niet gevonden", httpStatus.NOT_FOUND);
  }

  const response = await qlsClient.getShipment(shipment.qlsShipmentId, true);

  return persistShipmentResponse({
    orderId: order.id, 
    response,
    existingShipmentId: shipment.id,
  });
};

const downloadLabel = async (shipmentId: string, user?: any) => {
  const shipment = await prisma.qlsShipment.findUnique({
    where: { id: shipmentId },
    include: {
      order: true,
    },
  });

  if (!shipment) {
    throw new AppError("Verzending niet gevonden", httpStatus.NOT_FOUND);
  }

  if (user?.role !== "admin" && shipment.order.userId !== user?.id) {
    throw new AppError("U bent niet gemachtigd om toegang te krijgen tot dit label", 403);
  }

  let labelUrl = shipment.labelPdfUrl;

  if (!labelUrl && shipment.qlsShipmentId) {
    const response = await qlsClient.getShipment(shipment.qlsShipmentId, true);
    const refreshed = await persistShipmentResponse({
      orderId: shipment.orderId,
      response,
      existingShipmentId: shipment.id,
    });
    labelUrl = refreshed.labelPdfUrl;
  }

  if (!labelUrl) {
    throw new AppError("QLS-label is nog niet beschikbaar", httpStatus.NOT_FOUND);
  }

  const label = await qlsClient.downloadLabel(labelUrl);

  await prisma.qlsShipmentEvent.create({
    data: {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      eventType: "label",
      qlsStatus: shipment.status,
      qlsShipmentId: shipment.qlsShipmentId,
      barcode: shipment.barcode,
      trackingId: shipment.trackingId,
      payload: {
        labelUrl,
      },
    },
  });

  return {
    ...label,
    filename: `qls-label-${shipment.reference || shipment.id}.pdf`,
  };
};

const getWebhookTypes = async () => {
  return qlsClient.getWebhookTypes();
};

const registerWebhook = async (payload: { url: string; typeId: number }) => {
  return qlsClient.registerWebhook({
    url: payload.url,
    type_id: payload.typeId,
  });
};

const handleWebhook = async (payload: any) => {
  const shipmentPayload = payload?.data || payload?.shipment || payload;
  const qlsShipmentId = shipmentPayload?.id || payload?.shipment_id;
  const barcode = shipmentPayload?.barcode || payload?.barcode;
  const trackingId = shipmentPayload?.tracking_id || payload?.tracking_id;
  const reference = shipmentPayload?.reference || payload?.reference;
  const status = normalizeQlsStatus(shipmentPayload?.status || payload?.status);
  const orderStatus = getOrderStatusForShipmentStatus(status);

  const existingShipment = await prisma.qlsShipment.findFirst({
    where: {
      OR: [
        qlsShipmentId ? { qlsShipmentId } : undefined,
        barcode ? { barcode } : undefined,
        trackingId ? { trackingId } : undefined,
        reference ? { reference } : undefined,
      ].filter(Boolean) as any[],
    },
  });
  const previousOrder =
    orderStatus === OrderStatus.delivered && existingShipment?.orderId
      ? await prisma.order.findUnique({
          where: {
            id: existingShipment.orderId,
          },
          select: {
            status: true,
          },
        })
      : null;

  const event = await prisma.$transaction(async (tx) => {
    let shipment = existingShipment;

    if (shipment) {
      shipment = await tx.qlsShipment.update({
        where: {
          id: shipment.id,
        },
        data: {
          status,
          qlsShipmentId: qlsShipmentId || shipment.qlsShipmentId,
          barcode: barcode || shipment.barcode,
          trackingId: trackingId || shipment.trackingId,
          trackingUrl: shipmentPayload?.tracking_url || shipment.trackingUrl,
          labelPdfUrl:
            shipmentPayload?.label_pdf_url ||
            shipmentPayload?.label ||
            shipment.labelPdfUrl,
          labelZplUrl:
            shipmentPayload?.label_zpl_url ||
            shipmentPayload?.label_zpl ||
            shipment.labelZplUrl,
          rawResponse: JSON.parse(JSON.stringify(shipmentPayload || payload)),
          lastSyncedAt: new Date(),
        },
      });

      if (orderStatus) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { status: orderStatus },
        });
      }
    }

    return tx.qlsShipmentEvent.create({
      data: {
        shipmentId: shipment?.id,
        orderId: shipment?.orderId,
        eventType: "webhook",
        qlsStatus: shipmentPayload?.status || payload?.status || null,
        qlsShipmentId: qlsShipmentId || null,
        barcode: barcode || null,
        trackingId: trackingId || null,
        payload: JSON.parse(JSON.stringify(payload || {})),
      },
    });
  });

  if (
    orderStatus === OrderStatus.delivered &&
    existingShipment?.orderId &&
    previousOrder?.status !== OrderStatus.delivered
  ) {
    await sendDeliveredOrderReviewEmail(existingShipment.orderId);
  }

  return event;
};

export const shippingService = {
  getShippingMethods,
  getSetupCompanies,
  getSetupBrands,
  getSetupProducts,
  getSetupProductCombinations,
  getSupportedCarriers,
  getCarrierLabel,
  createShipment,
  getOrderShipment,
  refreshShipment,
  downloadLabel,
  getWebhookTypes,
  registerWebhook,
  handleWebhook,
};
