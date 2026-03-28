import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import crypto from "crypto";
import { otpQueueEmail } from "../../bullMQ/init";

const successPayment = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  const design = await prisma.design.findUnique({
    where: {
      id: order?.designId,
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
      status:"processing"
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

  const job = await otpQueueEmail.add(
    "orderConfirmation",
    {
      userName: user?.name,
      email: user?.email,
      subject: "Order Confirmation",
      data: {
        orderNumber: transactionId,
        orderDate: order.createdAt.toDateString(),
        items: {
          name: design?.name,
          quantity: order.quantity,
          price: design?.price,
          image: design?.design,
        },
        subtotal: order.total - order.deliveryFee,
        shippingFee: order.deliveryFee,
        totalAmount: order.total,
        deliveryAddress: user?.addresses[0].address,
        paymentMethod: "Stripe",
      },
    },
    {
      jobId: `${user?.id}-${Date.now()}`,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
  );
  return job;
};

export const paymentService = {
  successPayment,
};
