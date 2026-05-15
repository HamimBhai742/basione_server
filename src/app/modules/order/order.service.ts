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

type FrontendDeliveryType =
  | "standard-delivery"
  | "express-delivery"
  | "express-pickup"
  | "standard-pickup";

interface CreateOrderPayload {
  deliveryType: FrontendDeliveryType;
  deliveryMethod?: "delivery" | "pickup";
  quantity: number;
  bannerId?: string;
  termsAccepted: boolean;
  hasEyelets?: boolean;
}

const VAT_RATE = 0.21;
const EYELETS_FEE = 3.5;

const DELIVERY_OPTIONS: Record<
  FrontendDeliveryType,
  {
    prismaDeliveryType: DeliveryType;
    method: DeliveryMethod;
    fee: number;
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

const getPriceExcludingVatFromIncludedVat = (priceIncludingVat: number) => {
  return roundToTwo(priceIncludingVat / (1 + VAT_RATE));
};

const getVatAmountFromIncludedVat = (priceIncludingVat: number) => {
  const priceExcludingVat = getPriceExcludingVatFromIncludedVat(priceIncludingVat);
  return roundToTwo(priceIncludingVat - priceExcludingVat);
};

const calculateOrderPrice = ({
  bannerPrice,
  quantity,
  deliveryFee,
  eyeletsFee,
}: {
  bannerPrice: number; // banner price is already including VAT
  quantity: number;
  deliveryFee: number;
  eyeletsFee: number;
}) => {
  // Banner total price is already INCLUDING VAT
  const bannerSubtotalIncludingVat = roundToTwo(bannerPrice * quantity);

  // VAT breakdown only for banner/spandoek price
  const bannerPriceExcludingVat = getPriceExcludingVatFromIncludedVat(
    bannerSubtotalIncludingVat,
  );

  const vatAmount = getVatAmountFromIncludedVat(bannerSubtotalIncludingVat);

  // Delivery and eyelets are added separately, no VAT calculation on them
  const deliveryFeeRounded = roundToTwo(deliveryFee);
  const eyeletsFeeRounded = roundToTwo(eyeletsFee);

  const total = roundToTwo(
    bannerSubtotalIncludingVat + deliveryFeeRounded + eyeletsFeeRounded,
  );

  return {
    // Keep subtotal as banner price including VAT
    subtotal: bannerSubtotalIncludingVat,

    deliveryFee: deliveryFeeRounded,
    eyeletsFee: eyeletsFeeRounded,

    // This is only banner/spandoek excluding VAT
    priceExcludingVat: bannerPriceExcludingVat,

    vatRate: VAT_RATE,

    // VAT amount only from banner/spandoek
    vatAmount,

    // Final payable amount
    total,

    // Optional clear fields if schema supports later
    bannerPriceIncludingVat: bannerSubtotalIncludingVat,
    bannerPriceExcludingVat,
  };
};

const createOrder = async (
  userId: string,
  bannerId: string,
  payload: CreateOrderPayload,
) => {
  const { deliveryType, quantity, hasEyelets = false } = payload;

  if (!userId) {
    throw new AppError("User id is required.", httpStatus.UNAUTHORIZED);
  }

  if (!bannerId) {
    throw new AppError("Banner id is required.", httpStatus.BAD_REQUEST);
  }

  if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
    throw new AppError("Quantity must be at least 1.", httpStatus.BAD_REQUEST);
  }

  const selectedDeliveryOption = DELIVERY_OPTIONS[deliveryType];

  if (!selectedDeliveryOption) {
    throw new AppError(
      "Invalid delivery or pickup option.",
      httpStatus.BAD_REQUEST,
    );
  }

  const banner = await prisma.banner.findUnique({
    where: {
      id: bannerId,
    },
  });

  if (!banner) {
    throw new AppError("Banner not found.", httpStatus.NOT_FOUND);
  }

  // banner.price is already INCLUDING VAT
  const bannerPrice = Number(banner.price);

  if (Number.isNaN(bannerPrice) || bannerPrice < 0) {
    throw new AppError("Invalid banner price.", httpStatus.BAD_REQUEST);
  }

  const eyeletsFee = hasEyelets ? EYELETS_FEE : 0;

  const priceCalculation = calculateOrderPrice({
    bannerPrice,
    quantity,
    deliveryFee: selectedDeliveryOption.fee,
    eyeletsFee,
  });

  const trackingNumber = await getNextOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    await tx.banner.update({
      where: {
        id: bannerId,
      },
      data: {
        userId,
      },
    });

    return tx.order.create({
      data: {
        quantity,

        deliveryType: selectedDeliveryOption.prismaDeliveryType,
        deliveryMethod: selectedDeliveryOption.method,
        deliveryLabel: selectedDeliveryOption.label,
        deliveryFee: priceCalculation.deliveryFee,
        deliveryTime: selectedDeliveryOption.time,

        hasEyelets,
        eyeletsFee: priceCalculation.eyeletsFee,

        // Banner price including VAT
        subtotal: priceCalculation.subtotal,

        // VAT breakdown only for banner/spandoek price
        priceExcludingVat: priceCalculation.priceExcludingVat,
        vatRate: priceCalculation.vatRate,
        vatAmount: priceCalculation.vatAmount,

        // Final total = banner incl. VAT + delivery + eyelets
        total: priceCalculation.total,

        userId,
        bannerId,
        trackingNumber,
      },
    });
  });

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
    throw new AppError("Name is required", httpStatus.BAD_REQUEST);
  }

  if (!phone) {
    throw new AppError("Phone number is required", httpStatus.BAD_REQUEST);
  }

  if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) {
    throw new AppError("Invalid phone number", httpStatus.BAD_REQUEST);
  }

  if (!email) {
    throw new AppError("Email is required", httpStatus.BAD_REQUEST);
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError("Invalid email address", httpStatus.BAD_REQUEST);
  }

  if (!street) {
    throw new AppError("Street is required", httpStatus.BAD_REQUEST);
  }

  if (!houseNumber) {
    throw new AppError("House number is required", httpStatus.BAD_REQUEST);
  }

  if (!zipCode) {
    throw new AppError("Zip code is required", httpStatus.BAD_REQUEST);
  }

  if (!city) {
    throw new AppError("City is required", httpStatus.BAD_REQUEST);
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

const checkOut = async (
  orderId: string,
  userId: string,
  payload: CheckOutPayload,
) => {
  if (!orderId) {
    throw new AppError("Order id is required", httpStatus.BAD_REQUEST);
  }

  if (!userId) {
    throw new AppError("User id is required", httpStatus.UNAUTHORIZED);
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
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
  }

  if (order.userId !== userId) {
    throw new AppError("You are not authorized", httpStatus.UNAUTHORIZED);
  }

  if (order.status === "cancelled") {
    throw new AppError("Order is cancelled", httpStatus.BAD_REQUEST);
  }

  if (order.payment?.status === "paid") {
    throw new AppError("Order already paid", httpStatus.BAD_REQUEST);
  }

  if (order.total <= 0) {
    throw new AppError("Invalid order amount", httpStatus.BAD_REQUEST);
  }

  const banner = await prisma.banner.findUnique({
    where: {
      id: order.bannerId,
    },
  });

  if (!banner) {
    throw new AppError("Banner not found", httpStatus.NOT_FOUND);
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.address.upsert({
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
        userId,
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
        userId,
        orderId,
      },
    });

    const paymentSession = await createPayment(
      {
        orderId,
        amount: order.total,
        customerName: validatedAddress.name,
        companyName: validatedAddress.companyName,
        customerEmail: validatedAddress.email,
      },
      userId,
      tx,
    );

    return paymentSession;
  });

  return result.checkoutUrl;
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
    orders,
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
) => {
  const orders = await prisma.order.findMany({
    where: {
      userId,
    },
    include: {
      banner: true,
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
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
    orders,
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
    },
  });

  return order;
};

export const cancledOrder = async (orderId: string, reason?: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
      banner: true,
    },
  });

  if (order?.status !== "pending" && order?.status !== "processing") {
    throw new AppError(
      "Only pending orders can be canceled",
      httpStatus.BAD_REQUEST,
    );
  }
  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: "cancelled",
    },
  });

  const data = {
    userName: order?.user.name as string,
    email: order?.user.email as string,
    orderId: order?.id as string,
    orderDate: order?.createdAt.toLocaleString() as string,
    cancelledDate: new Date().toLocaleString(),
    items: [
      {
        name: `${formatLabel(order?.banner.occasion) as string} Banner`,
        quantity: order?.quantity as number,
        price: order?.banner.price as number,
      },
    ],
    subtotal: order.total,
    cancelReason: reason || "User requested cancellation",
    cancelledBy: "user",
  };
  await orderCancelledTemplate(data as OrderCancelledData);
};

export const orderService = {
  createOrder,
  checkOut,
  getMyOrders,
  getSingleOrder,
  cancledOrder,
  getMyDesigns,
};
