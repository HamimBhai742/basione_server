import { mollieClient } from "../../lib/mollie";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { generateTransactionId } from "../../utils/generateTransactionId";
import { paymentSuccessTemplate } from "../../utils/emailTemplates/paymentSuccess";

export const createPayment = async (payload: any, userId: string) => {
  const { amount, orderId, customerName } = payload;

  const transactionId = generateTransactionId();
  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount,
      transactionId,
      status: "pending",
      userId,
    },
  });
  const checkout = await mollieClient.payments.create({
    amount: {
      currency: "EUR",
      value: Number(amount).toFixed(2), // Mollie string decimal চায়
    },
    description: `Order #${orderId} - ${customerName}`,
    redirectUrl: `http://localhost:3000/payment/success?paymentId=${payment.id}&orderId=${orderId}`, // frontend url
    webhookUrl: `https://basione-server.vercel.app/api/v1/payment/mollie/webhook`,
    cancelUrl: `http://localhost:3000/payment/canceled?paymentId=${payment.id}&orderId=${orderId}`,
    metadata: {
      orderId,
      customerName,
      paymentId: payment.id,
      userId,
    },
  });

  return {
    checkoutUrl: checkout.getCheckoutUrl(),
  };
};

const mollieWebhook = async (payId: string) => {
  if (!payId) {
    throw new AppError("Payment ID not found", httpStatus.BAD_REQUEST);
  }

  const payment = await mollieClient.payments.get(payId);
  console.log(payment);
  const { orderId, paymentId, userId } = payment.metadata as any;

  if (payment.status === "paid") {
    console.log("paid");
    await paymentPaid(orderId, paymentId, userId, payment);
  } else if (payment.status === "failed") {
    console.log("failed");
    await paymentFailed(orderId, paymentId);
  } else if (payment.status === "canceled") {
    console.log("canceled");
    await paymentCanceled(orderId, paymentId);
  } else if (payment.status === "expired") {
    console.log("expired");
    await paymentExpired(orderId, paymentId);
  }

  return {
    message: "Payment pending",
  };
};

const paymentPaid = async (
  orderId: string,
  paymentId: string,
  userId: string,
  payments: any,
) => {
  console.log(orderId, paymentId);
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: "paid",
        status: "processing",
      },
    });

    const cleanPayment = JSON.parse(JSON.stringify(payments));
    await tx.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: "paid",
        paymentJSON: cleanPayment,
      },
    });
  });

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
  });
  if (!user || !order || !payment) {
    throw new AppError("Data not found", httpStatus.NOT_FOUND);
  }
  await paymentSuccessTemplate({
    userName: user?.name,
    email: user?.email,
    amount: order?.total,
    transactionId: payment?.transactionId,
    orderId,
    date: order?.createdAt.toDateString(),
  });
};

const paymentFailed = async (orderId: string, paymentId: string) => {
  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: "failed",
      status: "cancelled",
    },
  });

  await prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status: "failed",
    },
  });
};

const paymentCanceled = async (orderId: string, paymentId: string) => {
  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: "cancelled",
      status: "cancelled",
    },
  });

  await prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status: "cancelled",
    },
  });
};

const paymentExpired = async (orderId: string, paymentId: string) => {
  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: "expired",
      status: "cancelled",
    },
  });

  await prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status: "expired",
    },
  });
};

export const paymentService = {
  createPayment,
  mollieWebhook,
};
