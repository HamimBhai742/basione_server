import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { stripe } from "../../lib/stripe";

const createOrder = async (userId: string, designId: string, payload: any) => {
  let deliveryFee = 0;
  let deliveryTime = "";
  if (payload.deliveryType === "standard") {
    deliveryFee = 5;
    deliveryTime = "3-5 days";
  } else if (payload.deliveryType === "express") {
    deliveryFee = 15;
    deliveryTime = "1-2 days";
  }

  const design = await prisma.design.findUnique({
    where: {
      id: designId,
    },
  });

  if (!design) {
    throw new AppError("Design not found", httpStatus.NOT_FOUND);
  }
  const totalAmount = Number(design.price * payload.quantity + deliveryFee);

  const order = await prisma.order.create({
    data: {
      ...payload,
      deliveryFee,
      deliveryTime,
      total: totalAmount,
      userId,
      designId,
    },
  });

  return order;
};

const checkOut = async (orderId: string, userId: string, payload: any) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
  }

  const design = await prisma.design.findUnique({
    where: {
      id: order?.designId,
    },
  });

  if (!design) {
    throw new AppError("Design not found", httpStatus.NOT_FOUND);
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

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: design?.name,
            metadata: {
              orderId,
              userId,
              designId: design?.id,
            },
          },
          unit_amount: order.total * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
  });
  console.log(session);

  return session.url;
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
      design: true,
      addresses: true,
      payment: true,
    },
  });

  return order;
};

export const orderService = {
  createOrder,
  checkOut,
  getMyOrders,
  getSingleOrder,
};
