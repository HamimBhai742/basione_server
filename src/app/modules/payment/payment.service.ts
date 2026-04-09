import { mollieClient } from "../../lib/mollie";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";

const createPayment = async (payload: any) => {
  const { amount, orderId, customerName } = payload;

  const payment = await mollieClient.payments.create({
    amount: {
      currency: "EUR",
      value: Number(amount).toFixed(2), // Mollie string decimal চায়
    },
    description: `Order #${orderId} - ${customerName}`,
    redirectUrl: `https://fortifiable-unpopulous-sonia.ngrok-free.dev/`,
    webhookUrl: `https://fortifiable-unpopulous-sonia.ngrok-free.dev/api/v1/payment/mollie/webhook`,
    metadata: {
      orderId,
      customerName,
    },
  });

  return {
    checkoutUrl: payment.getCheckoutUrl(),
  };
};

const mollieWebhook = async (paymentId: string) => {
  if (!paymentId) {
    throw new AppError("Payment ID not found", httpStatus.BAD_REQUEST);
  }

  const payment = await mollieClient.payments.get(paymentId);
  console.log(payment)
  const orderId = (payment.metadata as any)?.orderId;

  if (payment.status === "paid") {
    console.log(`Order ${orderId} paid`);
  } else if (payment.status === "failed") {
    console.log(`Order ${orderId} failed`);
  } else if (payment.status === "canceled") {
    console.log(`Order ${orderId} canceled`);
  } else if (payment.status === "expired") {
    console.log(`Order ${orderId} expired`);
  }

  return payment;
};

export const paymentService = {
  createPayment,
  mollieWebhook,
};
