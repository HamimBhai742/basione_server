import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import crypto from "crypto";
import { otpQueueEmail } from "../../bullMQ/init";
import { paymentSuccessTemplate } from "../../utils/emailTemplates/paymentSuccess";
import { paymentCancelTemplate } from "../../utils/emailTemplates/paymentCanceled";

const successPayment = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  const banner = await prisma.banner.findUnique({
    where: {
      id: order?.bannerId,
    },
  });

  if (!order) {
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
  }

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: "paid",
      status: "processing",
    },
  });

  const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount: order.total,
      status: "paid",
      transactionId,
      userId: order.userId,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: order.userId,
    },
    include: {
      addresses: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  //   const job = await otpQueueEmail.add(
  //     "orderConfirmation",
  //     {
  //       userName: user?.name,
  //       email: user?.email,
  //       subject: "Order Confirmation",
  //       data: {
  //         orderNumber: transactionId,
  //         orderDate: order.createdAt.toDateString(),
  //         items: {
  //           name: banner?.name,
  //           quantity: order.quantity,
  //           price: banner?.price,
  //           image: banner?.banner,
  //         },
  //         subtotal: order.total - order.deliveryFee,
  //         shippingFee: order.deliveryFee,
  //         totalAmount: order.total,
  //         deliveryAddress: user?.addresses[0].address,
  //         paymentMethod: "Stripe",
  //       },
  //     },
  //     {
  //       jobId: `${user?.id}-${Date.now()}`,
  //       removeOnComplete: true,
  //       attempts: 3,
  //       backoff: { type: "fixed", delay: 5000 },
  //     },
  //   );

  // await otpQueueEmail.add(
  //   "paymentSuccessTemplate",
  //   {
  //     data: {
  //       userName: user?.name,
  //       email: user?.email,
  //       amount: order?.total,
  //       transactionId,
  //       orderId,
  //       date: order?.createdAt.toDateString(),
  //     },
  //   },
  //   {
  //     jobId: `${user?.id}-${Date.now()}`,
  //     removeOnComplete: true,
  //     attempts: 3,
  //     backoff: { type: "fixed", delay: 5000 },
  //   },
  // );

  await paymentSuccessTemplate({
    userName: user?.name,
    email: user?.email,
    amount: order?.total,
    transactionId,
    orderId,
    date: order?.createdAt.toDateString(),
  });
  return order;
};

const cancelePayment = async (orderId: string) => {
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

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: "canceled",
      status: "canceled",
    },
  });

  const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  await prisma.payment.create({
    data: {
      orderId,
      amount: order.total,
      status: "canceled",
      userId: order.userId,
      transactionId,
    },
  });

  // await otpQueueEmail.add(
  //   "paymentCancelTemplate",
  //   {
  //     data: {
  //       userName: order?.user?.name,
  //       email: order?.user?.email,
  //       amount: order?.total,
  //       transactionId,
  //       orderId,
  //     },
  //   },
  //   {
  //     jobId: `${order?.user?.id}-${Date.now()}`,
  //     removeOnComplete: true,
  //     attempts: 3,
  //     backoff: { type: "fixed", delay: 5000 },
  //   },
  // );

  await paymentCancelTemplate({
    userName: order?.user?.name,
    email: order?.user?.email,
    amount: order?.total,
    transactionId,
    orderId,
  });
  return null;
};

export const paymentService = {
  successPayment,
  cancelePayment,
};
