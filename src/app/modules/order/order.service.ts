import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { stripe } from "../../lib/stripe";
import crypto from "crypto";
import {
  OrderCancelledData,
  orderCancelledTemplate,
} from "../../utils/emailTemplates/ordercanclled";
import { orderConfirmedTemplate } from "../../utils/emailTemplates/orderConfirmation";
import { createPayment } from "../payment/payment.service";

const createOrder = async (userId: string, bannerId: string, payload: any) => {
  let deliveryFee = 0;
  let deliveryTime = "";
  if (payload.deliveryType === "standard") {
    deliveryFee = 5;
    deliveryTime = "3-5 days";
  } else if (payload.deliveryType === "express") {
    deliveryFee = 15;
    deliveryTime = "1-2 days";
  }

  const banner = await prisma.banner.findUnique({
    where: {
      id: bannerId,
    },
  });

  if (!banner) {
    throw new AppError("banner not found", httpStatus.NOT_FOUND);
  }
  await prisma.banner.update({
    where: {
      id: bannerId,
    },
    data: {
      userId,
    },
  });
  const totalAmount = Number(banner.price * payload.quantity + deliveryFee);

  const order = await prisma.order.create({
    data: {
      ...payload,
      deliveryFee,
      deliveryTime,
      total: totalAmount,
      userId,
      bannerId,
    },
  });

  return order;
};

const checkOut = async (orderId: string, userId: string, payload: any) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
  }

  if (order.userId !== userId) {
    throw new AppError("You are not authorized", httpStatus.UNAUTHORIZED);
  }

  const pay = await prisma.payment.findUnique({
    where: {
      orderId,
    },
  });

  if (order?.status === "cancelled") {
    throw new AppError("Order is canceled", httpStatus.BAD_REQUEST);
  }
  console.log(pay);
  if (pay?.status === "paid") {
    throw new AppError("Order already paid", httpStatus.BAD_REQUEST);
  }

  const banner = await prisma.banner.findUnique({
    where: {
      id: order?.bannerId,
    },
  });

  if (!banner) {
    throw new AppError("banner not found", httpStatus.NOT_FOUND);
  }

  if (order.userId !== userId) {
    throw new AppError("You are not authorized", httpStatus.UNAUTHORIZED);
  }

  await prisma.address.create({
    data: {
      ...payload,
      userId,
      orderId,
    },
  });

  // const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  // const payment = await prisma.payment.create({
  //   data: {
  //     orderId,
  //     amount: order.total,
  //     transactionId,
  //     status: "pending",
  //     userId,
  //   },
  // });

  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ["card"],

  //   line_items: [
  //     {
  //       price_data: {
  //         currency: "usd",
  //         product_data: {
  //           name: banner?.name,
  //         },
  //         unit_amount: order.total * 100,
  //       },
  //       quantity: 1,
  //     },
  //   ],
  //   customer_email: payload?.email,
  //   mode: "payment",
  //   success_url: `http://localhost:3000/success?orderId=${orderId}`,
  //   cancel_url: `http://localhost:3000/cancel?orderId=${orderId}`,
  //   metadata: {
  //     orderId,
  //     paymentId: payment.id,
  //   },
  //   payment_intent_data: {
  //     metadata: {
  //       orderId,
  //       paymentId: payment.id,
  //     },
  //   },
  //   expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Session expires in 30 minutes
  // });
  // console.log(session);

  const data = {
    orderId,
    amount: order.total,
    customerName: order.user.name,
  };
  const session = await createPayment(data, userId);
  return session.checkoutUrl;
};

const getMyOrders = async (
  userId: string,
  page: number,
  limit: number,
  skip: number,
) => {
  console.log(userId, page, limit, skip);
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
  console.log(orders);
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
        name: order?.banner.headline as string,
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

const orderConfirmationByAdmin = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
      banner: true,
      addresses: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
  }

  if (order.status !== "pending") {
    throw new AppError(
      "Only pending orders can be confirmed",
      httpStatus.BAD_REQUEST,
    );
  }

  if (order.paymentStatus !== "paid") {
    throw new AppError(
      "Only paid orders can be confirmed",
      httpStatus.BAD_REQUEST,
    );
  }

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: "processing",
    },
  });

  const data = {
    userName: order?.user.name as string,
    email: order?.user.email as string,
    orderId,
    orderDate: order?.createdAt.toLocaleString(),
    estimatedDelivery: order?.deliveryTime,
    items: [
      {
        name: order?.banner.name as string,
        quantity: order?.quantity as number,
        price: order?.banner.price as number,
        imageUrl: order?.banner.imageUrl as string,
      },
    ],
    subtotal: order?.total - order?.deliveryFee,
    shippingCost: order?.deliveryFee,
    discount: 0,
    total: order?.total,
    shippingAddress: {
      address: order?.addresses?.address as string,
      zipCode: order?.addresses?.postalCode as string,
      country: order?.addresses?.country as string,
    },
    paymentMethod: "Stripe",
  };
  await orderConfirmedTemplate(data);
};

export const orderService = {
  createOrder,
  checkOut,
  getMyOrders,
  getSingleOrder,
  cancledOrder,
  orderConfirmationByAdmin,
};
