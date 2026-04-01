import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import crypto from "crypto";
import { otpQueueEmail } from "../../bullMQ/init";
import { paymentSuccessTemplate } from "../../utils/emailTemplates/paymentSuccess";
import { paymentFailedTemplate } from "../../utils/emailTemplates/paymentFailed";
import { paymentCancelledTemplate } from "../../utils/emailTemplates/paymentCanceled";
import { orderConfirmedTemplate } from "../../utils/emailTemplates/orderConfirmation";

export const successPayment = async (orderId: string, paymentId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      banner: true,
      user: true,
      addresses: true,
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
      status: "pending",
    },
  });

  const payment = await prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status: "paid",
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
    transactionId: payment?.transactionId,
    orderId,
    date: order?.createdAt.toDateString(),
  });
  return order;
};

export const failedPayment = async (
  orderId: string,
  paymentId: string,
  reason?: string,
  sessionUrl?: string,
) => {
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
      paymentStatus: "unpaid",
      status: "canceled",
    },
  });

  const payment = await prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status: "unpaid",
    },
  });

  await paymentFailedTemplate({
    userName: order?.user?.name,
    email: order?.user?.email,
    amount: order?.total,
    transactionId: payment?.transactionId,
    date: order?.createdAt.toDateString(),
    orderId,
    failureReason: reason,
    sessionUrl,
  });
};

export const cancelePayment = async (orderId: string, reason?: string) => {
  console.log(orderId);
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
      paymentStatus: "unpaid",
      status: "canceled",
    },
  });

  const payment = await prisma.payment.update({
    where: {
      orderId: orderId,
    },
    data: {
      status: "unpaid",
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

  await paymentCancelledTemplate({
    userName: order?.user?.name,
    email: order?.user?.email,
    amount: order?.total,
    transactionId: payment?.transactionId,
    orderId,
    cancelReason: reason,
    date: order?.createdAt.toDateString(),
  });
  return null;
};
