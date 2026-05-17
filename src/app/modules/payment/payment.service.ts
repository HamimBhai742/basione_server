import { mollieClient } from "../../lib/mollie";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { generateTransactionId } from "../../utils/generateTransactionId";
import { paymentSuccessTemplate } from "../../utils/emailTemplates/paymentSuccess";
import { orderConfirmedTemplate } from "../../utils/emailTemplates/orderConfirmation";
import { cancledOrder } from "../order/order.service";
import { formatLabel } from "../../utils/formatLable";
import { Prisma } from "@prisma/client";
import fs from "fs";
import {
  generateAndSaveInvoice,
  markInvoiceAsSent,
} from "../invoice/invoice.service";
import { OrderConfirmedEmailData } from "../../../type/interface";

type TransactionClient = Prisma.TransactionClient;

interface CreatePaymentPayload {
  orderId: string;
  amount: number;
  customerName: string;
  companyName?: string | null;
  customerEmail?: string;
}

export const createPayment = async (
  payload: CreatePaymentPayload,
  userId: string,
  tx?: TransactionClient,
) => {
  const db = tx || prisma;

  const { amount, orderId, customerName, companyName, customerEmail } = payload;

  const transactionId = generateTransactionId();

  const existingPendingPayment = await db.payment.findFirst({
    where: {
      orderId,
      status: "pending",
    },
  });

  if (existingPendingPayment) {
    await db.payment.delete({
      where: {
        id: existingPendingPayment.id,
      },
    });
  }

  const payment = await db.payment.create({
    data: {
      orderId,
      amount,
      transactionId,
      status: "pending",
      userId,
    },
  });

  const displayName = companyName || customerName;

  const checkout = await mollieClient.payments.create({
    amount: {
      currency: "EUR",
      value: Number(amount).toFixed(2),
    },

    description: `Order #${orderId} - ${displayName}`,

    redirectUrl: `https://spandoekprint.nl/payment/success?paymentId=${payment.id}&orderId=${orderId}`,

    webhookUrl: `https://api.spandoekprint.nl/api/v1/payment/mollie/webhook`,

    cancelUrl: `https://spandoekprint.nl/api/v1/payment/canceled?paymentId=${payment.id}&orderId=${orderId}`,

    metadata: {
      orderId,
      paymentId: payment.id,
      userId,
      customerName,
      companyName: companyName || "",
      customerEmail: customerEmail || "",
    },
  });

  return {
    paymentId: payment.id,
    checkoutUrl: checkout.getCheckoutUrl(),
  };
};

const mollieWebhook = async (payId: string) => {
  if (!payId) {
    throw new AppError("Payment ID not found", httpStatus.BAD_REQUEST);
  }

  const payment = await mollieClient.payments.get(payId);
  const { orderId, paymentId, userId } = payment.metadata as any;

  const localPayment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (localPayment && localPayment.status === payment.status) {
    console.log(`Payment ${paymentId} already processed with status ${payment.status}, ignoring webhook duplicate.`);
    return { message: "Already processed" };
  }

  if (payment.status === "paid") {
    await paymentPaid(orderId, paymentId, userId, payment);
  } else if (payment.status === "failed") {
    const reason = "Payment failed by mollie";
    await paymentFailed(orderId, paymentId, reason);
  } else if (payment.status === "canceled") {
    const reason = "Payment canceled by user";
    await paymentCanceled(orderId, paymentId, reason);
  } else if (payment.status === "expired") {
    const reason = "Payment link expired";
    await paymentExpired(orderId, paymentId, reason);
  }

  return {
    message: "Payment pending",
  };
};

const paymentPaid = async (
  orderId: string,
  paymentId: string,
  userId: string,
  molliePayment: any,
) => {
console.log(orderId,paymentId,molliePayment,"fsdfgdsgdfghdfg")
  const cleanPayment = JSON.parse(JSON.stringify(molliePayment));

  /**
   * 1. Update order without transaction
   */
  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: "paid",
      status: "processing",
    },
    include: {
      banner: true,
      user: true,
      addresses: true,
      invoice: true,
    },
  });

  console.log("Order updated successfully:", {
    orderId: updatedOrder.id,
    paymentStatus: updatedOrder.paymentStatus,
    status: updatedOrder.status,
    userEmail: updatedOrder.user?.email,
  });

  /**
   * 2. Update payment without transaction
   */
  const updatedPayment = await prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status: "paid",
      paymentJSON: cleanPayment,
    },
  });

  console.log("Payment updated successfully:", {
    paymentId: updatedPayment.id,
    paymentStatus: updatedPayment.status,
    transactionId: updatedPayment.transactionId,
  });

  /**
   * 3. Get user
   */
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    console.error("User not found:", {
      userId,
      orderUserId: updatedOrder.userId,
    });

    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  if (!updatedOrder || !updatedPayment) {
    throw new AppError("Payment related data not found", httpStatus.NOT_FOUND);
  }

  console.log("User found:", {
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  /**
   * 4. Generate invoice
   */
  const invoice = await generateAndSaveInvoice({
    user,
    order: updatedOrder,
    payment: updatedPayment,
  });

  if (!invoice?.id) {
    console.error("Invoice generation failed:", invoice);

    throw new AppError(
      "Invoice generation failed",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  console.log("Invoice generated successfully:", {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceUrl: invoice.invoiceUrl,
    invoiceFilePath: invoice.invoiceFilePath,
  });

  /**
   * 5. Safe invoice file path
   */
  const safeInvoiceFilePath =
    invoice.invoiceFilePath && fs.existsSync(invoice.invoiceFilePath)
      ? invoice.invoiceFilePath
      : undefined;

  console.log("Safe invoice file path:", {
    originalPath: invoice.invoiceFilePath,
    safePath: safeInvoiceFilePath,
    exists: invoice.invoiceFilePath
      ? fs.existsSync(invoice.invoiceFilePath)
      : false,
  });

  /**
   * 6. Send payment success email
   */
  try {
    console.log("Calling paymentSuccessTemplate:", {
      to: user.email,
      orderId,
      invoiceNumber: invoice.invoiceNumber,
    });

    await paymentSuccessTemplate({
      userName: user.name || "Customer",
      email: user.email,
      amount: Number(updatedOrder.total || 0),
      transactionId: updatedPayment.transactionId,
      orderId,
      date: updatedOrder.createdAt.toDateString(),
      invoiceUrl: invoice.invoiceUrl,
      invoiceNumber: invoice.invoiceNumber,

      // first test e attachment path safe kore pathacchi
      invoiceFilePath: safeInvoiceFilePath,
    });

    console.log("paymentSuccessTemplate completed successfully");
  } catch (error: any) {
    console.error("paymentSuccessTemplate failed:", {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });
  }

  /**
   * 7. Prepare order confirmation email data
   */
  const emailData: OrderConfirmedEmailData = {
    userName: updatedOrder.user?.name || user.name || "Customer",
    email: updatedOrder.user?.email || user.email,

    orderId,
    orderDate: updatedOrder.createdAt.toLocaleString(),
    estimatedDelivery: updatedOrder.deliveryTime,

    items: [
      {
        name: `${
          formatLabel(updatedOrder.banner?.occasion || "custom") || "Custom"
        } Banner`,
        quantity: Number(updatedOrder.quantity || 1),
        price: Number(updatedOrder.banner?.price || updatedOrder.total || 0),
        imageUrl: updatedOrder.banner?.imageUrl || "",
      },
    ],

    subtotal: Number(updatedOrder.subtotal || 0),
    deliveryFee: Number(updatedOrder.deliveryFee || 0),
    eyeletsFee: Number(updatedOrder.eyeletsFee || 0),
    priceExcludingVat: Number(updatedOrder.priceExcludingVat || 0),
    vatRate: Number(updatedOrder.vatRate || 0.21),
    vatAmount: Number(updatedOrder.vatAmount || 0),
    total: Number(updatedOrder.total || 0),

    shippingAddress: {
      name: updatedOrder.addresses?.name || null,
      companyName: updatedOrder.addresses?.companyName || null,
      phone: updatedOrder.addresses?.phone || null,
      email: updatedOrder.addresses?.email || null,
      street: updatedOrder.addresses?.street || null,
      houseNumber: updatedOrder.addresses?.houseNumber || null,
      address: updatedOrder.addresses?.address || null,
      zipCode: updatedOrder.addresses?.zipCode || null,
      city: updatedOrder.addresses?.city || null,
    },

    paymentMethod: "Mollie",

    invoiceNumber: invoice.invoiceNumber,
    invoiceUrl: invoice.invoiceUrl,

    // first e safe path use korchi
    invoiceFilePath: safeInvoiceFilePath,
  };

  console.log("Order confirmation email data prepared:", {
    to: emailData.email,
    userName: emailData.userName,
    orderId: emailData.orderId,
    total: emailData.total,
    itemCount: emailData.items.length,
    invoiceUrl: emailData.invoiceUrl,
    invoiceFilePath: emailData.invoiceFilePath,
  });

  /**
   * 8. Send order confirmation email
   */
  let orderEmailSent = false;

  try {
    console.log("Calling orderConfirmedTemplate:", {
      to: emailData.email,
      orderId: emailData.orderId,
      invoiceNumber: emailData.invoiceNumber,
    });

    await orderConfirmedTemplate(emailData);

    orderEmailSent = true;

    console.log("orderConfirmedTemplate completed successfully");
  } catch (error: any) {
    orderEmailSent = false;

    console.error("orderConfirmedTemplate failed:", {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });
  }

  /**
   * 9. Mark invoice as sent only if order confirmation email sent
   */
  if (orderEmailSent) {
    try {
      console.log("Calling markInvoiceAsSent:", {
        invoiceId: invoice.id,
      });

      await markInvoiceAsSent(invoice.id);

      console.log("Invoice marked as sent successfully");
    } catch (error: any) {
      console.error("markInvoiceAsSent failed:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
  } else {
    console.log("Invoice not marked as sent because order email was not sent");
  }

  return {
    order: updatedOrder,
    payment: updatedPayment,
    invoice,
    orderEmailSent,
  };
};

const paymentFailed = async (
  orderId: string,
  paymentId: string,
  reason?: string,
) => {
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

  await cancledOrder(orderId, reason);
};

const paymentCanceled = async (
  orderId: string,
  paymentId: string,
  reason?: string,
) => {
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

  await cancledOrder(orderId, reason);
};

const paymentExpired = async (
  orderId: string,
  paymentId: string,
  reason?: string,
) => {
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

  await cancledOrder(orderId, reason);
};

export const paymentService = {
  createPayment,
  mollieWebhook,
};
