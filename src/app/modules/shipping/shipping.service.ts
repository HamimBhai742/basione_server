import { OrderStatus, QlsShipmentStatus } from "@prisma/client";
import httpStatus from "http-status";
import config from "../../../config";
import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import {
  qlsClient,
  QlsCreateShipmentPayload,
  QlsShipmentProduct,
} from "./qls.client";

type CreateShipmentPayload = {
  orderId: string;
  productCombinationId?: number;
  brandId?: string;
  weight?: number;
  servicepointCode?: string;
  customsInvoiceNumber?: string;
  customsShipmentType?: "commercial" | "documents" | "return" | "sample";
  shipmentProducts?: QlsShipmentProduct[];
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
      "Shipping address is required before creating a QLS shipment",
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

const buildShipmentProducts = (order: any): QlsShipmentProduct[] => [
  {
    amount: Number(order.quantity || 1),
    name: `${order.banner?.name || order.banner?.occasion || "Custom"} Banner`,
    price_per_unit: Number(order.banner?.price || order.total || 0),
    weight_per_unit: Number(
      Math.max(1, Math.round((order.weight || config.qls.defaultWeightGram) / Number(order.quantity || 1))),
    ),
    currency: "EUR",
  },
];

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
  const productCombinationId =
    payload.productCombinationId || config.qls.defaultProductCombinationId;

  if (!productCombinationId) {
    throw new AppError(
      "QLS_DEFAULT_PRODUCT_COMBINATION_ID is required, or send productCombinationId",
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
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
  }

  if (order.deliveryMethod === "pickup") {
    throw new AppError("Pickup orders do not need QLS shipment labels");
  }

  if (order.paymentStatus !== "paid") {
    throw new AppError("Only paid orders can be shipped", httpStatus.BAD_REQUEST);
  }

  if (order.status !== "ready") {
    throw new AppError(
      "Only ready orders can have QLS shipment labels created",
      httpStatus.BAD_REQUEST,
    );
  }

  const existingShipment = order.shipments.find(
    (shipment) => shipment.status !== "failed",
  );

  if (existingShipment?.qlsShipmentId) {
    throw new AppError(
      "A QLS shipment already exists for this order",
      httpStatus.CONFLICT,
    );
  }

  const weight = payload.weight || config.qls.defaultWeightGram;

  const requestPayload: QlsCreateShipmentPayload = {
    product_combination_id: productCombinationId,
    brand_id: payload.brandId || config.qls.brandId,
    servicepoint_code: payload.servicepointCode,
    reference: buildReference(order),
    weight,
    customs_invoice_number: payload.customsInvoiceNumber,
    customs_shipment_type: payload.customsShipmentType,
    receiver_contact: buildReceiverContact(order),
    shipment_products: payload.shipmentProducts || buildShipmentProducts(order),
  };
  console.log(requestPayload);

  const response = await qlsClient.createShipment(requestPayload);
  console.log("QlS create Shipment", response);

  const shipment = await persistShipmentResponse({
    orderId: order.id,
    requestPayload,
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
      payload: JSON.parse(JSON.stringify(response || {})),
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
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
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
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
  }

  const shipment = order.shipments[0];

  if (!shipment?.qlsShipmentId) {
    throw new AppError("QLS shipment not found", httpStatus.NOT_FOUND);
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
    throw new AppError("Shipment not found", httpStatus.NOT_FOUND);
  }

  if (user?.role !== "admin" && shipment.order.userId !== user?.id) {
    throw new AppError("You are not authorized to access this label", 403);
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
    throw new AppError("QLS label is not available yet", httpStatus.NOT_FOUND);
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

  return event;
};

export const shippingService = {
  getShippingMethods,
  getSetupCompanies,
  getSetupBrands,
  getSetupProducts,
  getSetupProductCombinations,
  createShipment,
  getOrderShipment,
  refreshShipment,
  downloadLabel,
  getWebhookTypes,
  registerWebhook,
  handleWebhook,
};
