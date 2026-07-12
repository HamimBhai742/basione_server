import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import {
  OrderCancelledData,
  orderCancelledTemplate,
} from "../../utils/emailTemplates/ordercanclled";
import { orderConfirmedTemplate } from "../../utils/emailTemplates/orderConfirmation";
import { createPayment } from "../payment/payment.service";
import { getNextOrderNumber } from "../../utils/trackingNumber";
import { formatLabel } from "../../utils/formatLable";
import { DeliveryMethod, DeliveryType } from "@prisma/client";
import { applyDesignNumberToBanner } from "../../utils/applyDesignNumberToBanner";
import { buildOrderReviewLink } from "../../utils/orderReview";
import {
  generateGuestOrderToken,
  getGuestOrderTokenExpiry,
} from "../../utils/guestOrderToken";
import { calculateDeliveryDate } from "../../utils/deliveryCalculator";


type FrontendDeliveryType =
  | "standard-delivery"
  | "express-delivery"
  | "express-pickup"
  | "standard-pickup";

interface CreateOrderPayloadItem {
  bannerId: string;
  quantity: number;
  hasEyelets?: boolean;
}

interface CreateOrderPayload {
  deliveryType: FrontendDeliveryType;
  deliveryMethod?: "delivery" | "pickup";
  quantity?: number;
  bannerId?: string;
  items?: CreateOrderPayloadItem[];
  termsAccepted: boolean;

  // Client requested default should be Yes.
  // Frontend should send true by default, but backend also defaults true for safety.
  hasEyelets?: boolean;
  isGuest?: boolean;
  guest?: boolean;
  source?: string;
  markDesignAsOrdered?: boolean;
  isOrdered?: boolean;
  designStatus?: string;
  lifecycleStatus?: string;
}

const isTruthyFlag = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "guest"].includes(value.toLowerCase());
  }

  return value === 1;
};

const VAT_RATE = 0.21;
const EYELETS_FEE = 3.5; // already INCLUDING VAT

const DELIVERY_OPTIONS: Record<
  FrontendDeliveryType,
  {
    prismaDeliveryType: DeliveryType;
    method: DeliveryMethod;
    fee: number; // already INCLUDING VAT
    time: string;
    label: string;
  }
> = {
  "standard-delivery": {
    prismaDeliveryType: DeliveryType.standard_delivery,
    method: DeliveryMethod.delivery,
    fee: 5,
    time: "3-5 werkdagen",
    label: "Standaard levering",
  },

  "express-delivery": {
    prismaDeliveryType: DeliveryType.express_delivery,
    method: DeliveryMethod.delivery,
    fee: 15,
    time: "1-2 werkdagen",
    label: "Express levering",
  },

  "express-pickup": {
    prismaDeliveryType: DeliveryType.express_pickup,
    method: DeliveryMethod.pickup,
    fee: 15,
    time: "Vandaag afhalen bij bestelling vóór 12:00",
    label: "Express afhalen",
  },

  "standard-pickup": {
    prismaDeliveryType: DeliveryType.standard_pickup,
    method: DeliveryMethod.pickup,
    fee: 0,
    time: "Klaar binnen 2-3 werkdagen",
    label: "Standaard afhalen",
  },
};

const roundToTwo = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const getDesignNumberFromTrackingNumber = (trackingNumber: string) => {
  const sequence = trackingNumber.split("-").pop();
  const numericSequence = Number(sequence);

  if (Number.isNaN(numericSequence) || numericSequence < 1) {
    return sequence || trackingNumber;
  }

  return String(numericSequence);
};

// Price is already INCLUDING VAT.
// Example: €15 incl. VAT => excl. VAT = 15 / 1.21
const getPriceExcludingVatFromIncludedVat = (priceIncludingVat: number) => {
  return roundToTwo(priceIncludingVat / (1 + VAT_RATE));
};

const getVatAmountFromIncludedVat = (priceIncludingVat: number) => {
  const priceExcludingVat =
    getPriceExcludingVatFromIncludedVat(priceIncludingVat);

  return roundToTwo(priceIncludingVat - priceExcludingVat);
};

const calculateOrderPrice = ({
  bannerPrice,
  quantity,
  deliveryFee,
  eyeletsFee,
}: {
  bannerPrice: number; // already INCLUDING VAT
  quantity: number;
  deliveryFee: number; // already INCLUDING VAT
  eyeletsFee: number; // already INCLUDING VAT
}) => {
  /**
   * Important:
   * Banner, delivery, and eyelets prices are already INCLUDING VAT.
   * So we do NOT add 21% again.
   * We only calculate VAT breakdown from those included prices.
   */

  // Banner
  const bannerSubtotalIncludingVat = roundToTwo(bannerPrice * quantity);
  const bannerPriceExcludingVat = getPriceExcludingVatFromIncludedVat(
    bannerSubtotalIncludingVat,
  );
  const bannerVatAmount = getVatAmountFromIncludedVat(
    bannerSubtotalIncludingVat,
  );

  // Delivery
  const deliveryFeeIncludingVat = roundToTwo(deliveryFee);
  const deliveryFeeExcludingVat = getPriceExcludingVatFromIncludedVat(
    deliveryFeeIncludingVat,
  );
  const deliveryVatAmount = getVatAmountFromIncludedVat(
    deliveryFeeIncludingVat,
  );

  // Eyelets / Rings
  const eyeletsFeeIncludingVat = roundToTwo(eyeletsFee);
  const eyeletsFeeExcludingVat = getPriceExcludingVatFromIncludedVat(
    eyeletsFeeIncludingVat,
  );
  const eyeletsVatAmount = getVatAmountFromIncludedVat(eyeletsFeeIncludingVat);

  // Summary
  const priceExcludingVat = roundToTwo(
    bannerPriceExcludingVat +
      deliveryFeeExcludingVat +
      eyeletsFeeExcludingVat,
  );

  const vatAmount = roundToTwo(
    bannerVatAmount + deliveryVatAmount + eyeletsVatAmount,
  );

  // Total payable amount stays same.
  // No extra 21% added here.
  const total = roundToTwo(
    bannerSubtotalIncludingVat +
      deliveryFeeIncludingVat +
      eyeletsFeeIncludingVat,
  );

  return {
    // Existing fields
    subtotal: bannerSubtotalIncludingVat,
    deliveryFee: deliveryFeeIncludingVat,
    eyeletsFee: eyeletsFeeIncludingVat,
    priceExcludingVat,
    vatRate: VAT_RATE,
    vatAmount,
    total,

    // Clear breakdown fields
    bannerPriceIncludingVat: bannerSubtotalIncludingVat,
    bannerPriceExcludingVat,
    bannerVatAmount,

    deliveryFeeIncludingVat,
    deliveryFeeExcludingVat,
    deliveryVatAmount,

    eyeletsFeeIncludingVat,
    eyeletsFeeExcludingVat,
    eyeletsVatAmount,
  };
};

const mapBannerDesign = (banner: any) => ({
  id: banner.id,
  imageUrl: banner.imageUrl,
  headline: banner.headline,
  name: banner.name,
  price: banner.price,
  width: banner.width,
  height: banner.height,
  size: banner.sizeLabel || banner.sizeType,
  sizeType: banner.sizeType,
  canvasJson: banner.canvasJson ?? banner.canvasJSON ?? null,
});

const shouldMarkDesignAsOrdered = (banner: any, payload: CreateOrderPayload) => {
  return (
    isTruthyFlag(payload.markDesignAsOrdered) ||
    isTruthyFlag(payload.isOrdered) ||
    payload.source === "saved_design_order" ||
    banner.isSavedDesign ||
    banner.savedFromEditor
  );
};

const createOrder = async (
  userId: string | undefined,
  bannerId: string | undefined,
  payload: CreateOrderPayload,
) => {
  const { deliveryType } = payload;
  const isGuestOrder =
    !userId || isTruthyFlag(payload.isGuest) || isTruthyFlag(payload.guest);

  if (!userId && !isGuestOrder) {
    throw new AppError("Gebruikers-id is verplicht.", httpStatus.UNAUTHORIZED);
  }

  const items = payload.items && payload.items.length > 0
    ? payload.items
    : bannerId
      ? [{ bannerId, quantity: payload.quantity || 1, hasEyelets: payload.hasEyelets !== undefined ? payload.hasEyelets : true }]
      : [];

  if (items.length === 0) {
    throw new AppError("Geen producten opgegeven voor de bestelling.", httpStatus.BAD_REQUEST);
  }

  const selectedDeliveryOption = DELIVERY_OPTIONS[deliveryType];

  if (!selectedDeliveryOption) {
    throw new AppError(
      "Ongeldige bezorg- of afhaaloptie.",
      httpStatus.BAD_REQUEST,
    );
  }

  const orderItemsData: any[] = [];
  let totalBannerPriceExclVat = 0;
  let totalBannerVatAmount = 0;
  let totalBannerPriceInclVat = 0;

  let totalEyeletsFeeExclVat = 0;
  let totalEyeletsVatAmount = 0;
  let totalEyeletsFeeInclVat = 0;

  const trackingNumber = await getNextOrderNumber();
  const baseDesignNumber = getDesignNumberFromTrackingNumber(trackingNumber);
  const orderedAt = new Date();

  const bannerUpdates: Array<{ id: string; data: any }> = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemBannerId = item.bannerId;
    const itemQuantity = item.quantity;
    const itemHasEyelets = item.hasEyelets !== undefined ? item.hasEyelets : true;

    if (!itemBannerId) {
      throw new AppError("Banner-id is verplicht.", httpStatus.BAD_REQUEST);
    }

    if (!itemQuantity || !Number.isInteger(itemQuantity) || itemQuantity < 1) {
      throw new AppError("Aantal moet minstens 1 zijn.", httpStatus.BAD_REQUEST);
    }

    const banner = await prisma.banner.findUnique({
      where: {
        id: itemBannerId,
      },
    });

    if (!banner) {
      throw new AppError("Banner niet gevonden.", httpStatus.NOT_FOUND);
    }

    if (banner.userId && banner.userId !== userId) {
      throw new AppError("Je bent niet geautoriseerd", httpStatus.FORBIDDEN);
    }

    const bannerPrice = Number(banner.price);

    if (Number.isNaN(bannerPrice) || bannerPrice < 0) {
      throw new AppError("Ongeldige bannerprijs.", httpStatus.BAD_REQUEST);
    }

    const eyeletsFee = itemHasEyelets ? EYELETS_FEE * itemQuantity : 0;

    const bannerTotalPriceInclVat = roundToTwo(bannerPrice * itemQuantity);
    const bannerPriceExclVat = getPriceExcludingVatFromIncludedVat(bannerTotalPriceInclVat);
    const bannerVatAmount = getVatAmountFromIncludedVat(bannerTotalPriceInclVat);

    const eyeletsFeeInclVat = roundToTwo(eyeletsFee);
    const eyeletsFeeExclVat = getPriceExcludingVatFromIncludedVat(eyeletsFeeInclVat);
    const eyeletsVatAmount = getVatAmountFromIncludedVat(eyeletsFeeInclVat);

    const itemSubtotalInclVat = bannerTotalPriceInclVat + eyeletsFeeInclVat;
    const itemExclVat = bannerPriceExclVat + eyeletsFeeExclVat;
    const itemVat = bannerVatAmount + eyeletsVatAmount;

    const designNumber = i === 0 ? baseDesignNumber : `${baseDesignNumber}-${i + 1}`;
    const finalBannerImageUrl = await applyDesignNumberToBanner({
      imageUrl: banner.imageUrl,
      designNumber,
      widthCm: banner.width,
      heightCm: banner.height,
    });

    const markDesignAsOrdered = shouldMarkDesignAsOrdered(banner, payload);

    orderItemsData.push({
      bannerId: itemBannerId,
      quantity: itemQuantity,
      hasEyelets: itemHasEyelets,
      eyeletsFee: roundToTwo(eyeletsFeeInclVat),
      price: bannerPrice,
      subtotal: roundToTwo(itemSubtotalInclVat),
      priceExcludingVat: roundToTwo(itemExclVat),
      vatAmount: roundToTwo(itemVat),
    });

    bannerUpdates.push({
      id: itemBannerId,
      data: {
        ...(userId ? { userId } : {}),
        designNumber,
        imageUrl: finalBannerImageUrl,
        ...(markDesignAsOrdered
          ? {
              isOrdered: true,
              isSavedDesign: true,
              savedFromEditor: true,
              source: payload.source || banner.source || "saved_design_order",
              designStatus: payload.designStatus || "ordered",
              lifecycleStatus: payload.lifecycleStatus || "ordered",
              orderedAt,
            }
          : {}),
      },
    });

    totalBannerPriceExclVat += bannerPriceExclVat;
    totalBannerVatAmount += bannerVatAmount;
    totalBannerPriceInclVat += bannerTotalPriceInclVat;

    totalEyeletsFeeExclVat += eyeletsFeeExclVat;
    totalEyeletsVatAmount += eyeletsVatAmount;
    totalEyeletsFeeInclVat += eyeletsFeeInclVat;
  }

  const deliveryFeeIncludingVat = roundToTwo(selectedDeliveryOption.fee);
  const deliveryFeeExcludingVat = getPriceExcludingVatFromIncludedVat(deliveryFeeIncludingVat);
  const deliveryVatAmount = getVatAmountFromIncludedVat(deliveryFeeIncludingVat);

  const subtotal = roundToTwo(totalBannerPriceInclVat);
  const priceExcludingVat = roundToTwo(
    totalBannerPriceExclVat + totalEyeletsFeeExclVat + deliveryFeeExcludingVat
  );
  const vatAmount = roundToTwo(
    totalBannerVatAmount + totalEyeletsVatAmount + deliveryVatAmount
  );
  const total = roundToTwo(
    totalBannerPriceInclVat + totalEyeletsFeeInclVat + deliveryFeeIncludingVat
  );

  const { formattedRange } = calculateDeliveryDate(deliveryType);

  const order = await prisma.$transaction(
    async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          quantity: items[0].quantity,
          deliveryType: selectedDeliveryOption.prismaDeliveryType,
          deliveryMethod: selectedDeliveryOption.method,
          deliveryLabel: selectedDeliveryOption.label,
          deliveryTime: selectedDeliveryOption.time,
          estimatedDeliveryDate: formattedRange,
          deliveryFee: deliveryFeeIncludingVat,

          hasEyelets: items[0].hasEyelets !== undefined ? items[0].hasEyelets : true,
          eyeletsFee: totalEyeletsFeeInclVat,

          subtotal,
          priceExcludingVat,
          vatRate: VAT_RATE,
          vatAmount,
          total,

          userId: userId || null,
          isGuest: isGuestOrder,
          bannerId: items[0].bannerId,
          trackingNumber,

          // Only include guest token fields for actual guest orders.
          // Passing `null` for a @unique field causes a constraint violation
          // when multiple logged-in users place orders.
          ...(isGuestOrder
            ? {
                guestOrderToken: generateGuestOrderToken(),
                guestTokenExpiresAt: getGuestOrderTokenExpiry(),
              }
            : {}),
        } as any,
      });

      for (const itemData of orderItemsData) {
        await tx.orderItem.create({
          data: {
            ...itemData,
            orderId: createdOrder.id,
          },
        });
      }

      for (const update of bannerUpdates) {
        await tx.banner.update({
          where: {
            id: update.id,
          },
          data: {
            ...update.data,
            orderId: createdOrder.id,
          },
        });
      }

      if (userId) {
        await tx.cartItem.deleteMany({
          where: {
            userId,
          },
        });
      }

      return createdOrder;
    },
    {
      timeout: 15000,
    }
  );

  return order;
};

interface CheckOutPayload {
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  street: string;
  houseNumber: string;
  address?: string;
  zipCode: string;
  city: string;
  orderId?: string;
  selectedPaymentMethod?: string;
}

const sanitizeString = (value?: string) => {
  return typeof value === "string" ? value.trim() : "";
};

const validateCheckoutPayload = (payload: CheckOutPayload) => {
  const name = sanitizeString(payload.name);
  const companyName = sanitizeString(payload.companyName);
  const phone = sanitizeString(payload.phone);
  const email = sanitizeString(payload.email);
  const street = sanitizeString(payload.street);
  const houseNumber = sanitizeString(payload.houseNumber);
  const address = sanitizeString(payload.address);
  const zipCode = sanitizeString(payload.zipCode);
  const city = sanitizeString(payload.city);

  if (!name) {
    throw new AppError("Naam is verplicht", httpStatus.BAD_REQUEST);
  }

  if (!phone) {
    throw new AppError("Telefoonnummer is verplicht", httpStatus.BAD_REQUEST);
  }

  if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) {
    throw new AppError("Ongeldig telefoonnummer", httpStatus.BAD_REQUEST);
  }

  if (!email) {
    throw new AppError("E-mailadres is verplicht", httpStatus.BAD_REQUEST);
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError("Ongeldig e-mailadres", httpStatus.BAD_REQUEST);
  }

  if (!street) {
    throw new AppError("Straat is verplicht", httpStatus.BAD_REQUEST);
  }

  if (!houseNumber) {
    throw new AppError("Huisnummer is verplicht", httpStatus.BAD_REQUEST);
  }

  if (!zipCode) {
    throw new AppError("Postcode is verplicht", httpStatus.BAD_REQUEST);
  }

  if (!city) {
    throw new AppError("Stad is verplicht", httpStatus.BAD_REQUEST);
  }

  return {
    name,
    companyName: companyName || null,
    phone,
    email,
    street,
    houseNumber,
    address: address || null,
    zipCode,
    city,
  };
};

const mapToMollieMethod = (method?: string): string | undefined => {
  if (!method) return undefined;
  const m = method.toLowerCase();
  if (["visa", "mastercard", "amex", "maestro"].includes(m)) {
    return "creditcard";
  }
  return m;
};

const checkOut = async (
  orderId: string,
  userId: string | undefined,
  payload: CheckOutPayload,
) => {
  if (!orderId) {
    throw new AppError("Bestel-id is verplicht", httpStatus.BAD_REQUEST);
  }

  const validatedAddress = validateCheckoutPayload(payload);

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
      payment: true,
      addresses: true,
    },
  });

  if (!order) {
    throw new AppError("Bestelling niet gevonden", httpStatus.NOT_FOUND);
  }

  if (order.userId) {
    if (!userId || order.userId !== userId) {
      throw new AppError("Je bent niet geautoriseerd", httpStatus.UNAUTHORIZED);
    }
  } else if (!order.isGuest) {
    throw new AppError("Je bent niet geautoriseerd", httpStatus.UNAUTHORIZED);
  }

  if (order.status === "cancelled") {
    throw new AppError("Bestelling is geannuleerd", httpStatus.BAD_REQUEST);
  }

  if (order.payment?.status === "paid") {
    throw new AppError("Bestelling is al betaald", httpStatus.BAD_REQUEST);
  }

  if (order.total <= 0) {
    throw new AppError("Ongeldig bestelbedrag", httpStatus.BAD_REQUEST);
  }

  const banner = await prisma.banner.findUnique({
    where: {
      id: order.bannerId || undefined,
    },
  });

  if (!banner) {
    throw new AppError("Banner niet gevonden", httpStatus.NOT_FOUND);
  }

  await prisma.address.upsert({
    where: {
      orderId,
    },
    update: {
      name: validatedAddress.name,
      companyName: validatedAddress.companyName,
      phone: validatedAddress.phone,
      email: validatedAddress.email,
      street: validatedAddress.street,
      houseNumber: validatedAddress.houseNumber,
      address: validatedAddress.address,
      zipCode: validatedAddress.zipCode,
      city: validatedAddress.city,
      userId: order.userId || userId || null,
    },
    create: {
      name: validatedAddress.name,
      companyName: validatedAddress.companyName,
      phone: validatedAddress.phone,
      email: validatedAddress.email,
      street: validatedAddress.street,
      houseNumber: validatedAddress.houseNumber,
      address: validatedAddress.address,
      zipCode: validatedAddress.zipCode,
      city: validatedAddress.city,
      userId: order.userId || userId || null,
      orderId,
    },
  });

  if (order.isGuest) {
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        guestEmail: validatedAddress.email,
        guestName: validatedAddress.name,
        guestPhone: validatedAddress.phone,
      },
    });
  }

  const result = await createPayment(
    {
      orderId,
      amount: order.total,
      customerName: validatedAddress.name,
      companyName: validatedAddress.companyName,
      customerEmail: validatedAddress.email,
      method: mapToMollieMethod(payload.selectedPaymentMethod),
    },
    order.userId || userId,
  );

  return result.checkoutUrl;
};

const getOrderTemplateId = (order: any) => {
  if (!order?.banner) {
    return null;
  }

  if (order.banner.sourceTemplateId) {
    return order.banner.sourceTemplateId;
  }

  return order.banner.isTemplate ? order.banner.id : null;
};

const attachReviewInfo = (order: any) => {
  const templateId = getOrderTemplateId(order);
  const hasExistingReview = Boolean(order?.templateReview);
  const canReview = Boolean(
    templateId &&
      order?.userId &&
      !order?.isGuest &&
      order?.status === "delivered" &&
      order?.paymentStatus === "paid" &&
      !hasExistingReview,
  );

  return {
    ...order,
    reviewInfo: {
      canReview,
      templateId,
      reviewLink: templateId ? buildOrderReviewLink(order.id) : null,
      review: order?.templateReview || null,
    },
  };
};

const getMyOrders = async (
  userId: string,
  page: number,
  limit: number,
  skip: number,
) => {
  const orders = await prisma.order.findMany({
    where: {
      userId,
    },
    include: {
      banner: true,
      payment: true,
      templateReview: true,
      items: {
        include: {
          banner: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
    skip,
  });

  const total = await prisma.order.count({
    where: {
      userId,
    },
  });

  return {
    orders: orders.map(attachReviewInfo),
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMyDesigns = async (
  userId: string,
  page: number,
  limit: number,
  skip: number,
  options: {
    savedOnly?: boolean;
    includeOrdered?: boolean;
  } = {},
) => {
  const where: any = {
    userId,
    isTemplate: false,
    isSavedDesign: true,
    savedFromEditor: true,
  };

  if (options.includeOrdered !== true) {
    where.orders = {
      none: {},
    };
    where.isOrdered = false;
  }

  const banners = await prisma.banner.findMany({
    where,
    select: {
      id: true,
      imageUrl: true,
      headline: true,
      name: true,
      price: true,
      width: true,
      height: true,
      sizeType: true,
      sizeLabel: true,
      source: true,
      savedFromEditor: true,
      isSavedDesign: true,
      isOrdered: true,
      designStatus: true,
      lifecycleStatus: true,
      orderedAt: true,
      orderId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
  });

  const total = await prisma.banner.count({
    where,
  });

  return {
    designs: banners.map((banner) => ({
      id: banner.id,
      banner: mapBannerDesign(banner),
    })),
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      userId,
    },
    include: {
      user: true,
      banner: true,
      addresses: true,
      payment: true,
      templateReview: true,
      items: {
        include: {
          banner: true,
        },
      },
    },
  });

  return order ? attachReviewInfo(order) : order;
};

const getGuestOrder = async (orderId: string, token?: string) => {
  if (!token) {
    throw new AppError("Guest token is verplicht", httpStatus.UNAUTHORIZED);
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
      banner: true,
      addresses: true,
      payment: true,
      templateReview: true,
      items: {
        include: {
          banner: true,
        },
      },
    },
  });

  if (!order || !order.isGuest) {
    throw new AppError("Bestelling niet gevonden", httpStatus.NOT_FOUND);
  }

  if (
    order.guestOrderToken !== token ||
    (order.guestTokenExpiresAt && order.guestTokenExpiresAt < new Date())
  ) {
    throw new AppError("Ongeldige guest token", httpStatus.UNAUTHORIZED);
  }

  return attachReviewInfo(order);
};

export const cancledOrder = async (orderId: string, reason?: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
      banner: true,
      addresses: true,
      items: {
        include: {
          banner: true,
        },
      },
    },
  });

  if (order?.status !== "pending" && order?.status !== "processing") {
    console.log(
      `[cancledOrder] Order ${orderId} already in non-cancellable state: "${order?.status}". Skipping cancellation.`,
    );
    return;
  }

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: "cancelled",
    },
  });

  const customerName =
    order?.user?.name || order?.guestName || order?.addresses?.name || "Customer";
  const customerEmail =
    order?.user?.email || order?.guestEmail || order?.addresses?.email;

  if (!customerEmail) {
    throw new AppError("E-mailadres niet gevonden", httpStatus.BAD_REQUEST);
  }

  const data = {
    userName: customerName,
    email: customerEmail,
    orderId: (order?.trackingNumber || order?.id) as string,
    orderDate: order?.createdAt.toLocaleString() as string,
    cancelledDate: new Date().toLocaleString(),
    items: [
      {
        name: `${formatLabel(order?.banner?.occasion || "custom") as string} Banner`,
        quantity: order?.quantity as number,
        price: (order?.banner?.price || 0) as number,
      },
    ],
    subtotal: order.total,
    cancelReason: reason || "Gebruiker heeft om annulering gevraagd",
    cancelledBy: "user",
  };
  await orderCancelledTemplate(data as OrderCancelledData);
};

export const orderService = {
  createOrder,
  checkOut,
  getMyOrders,
  getSingleOrder,
  getGuestOrder,
  cancledOrder,
  getMyDesigns,
};
