import httpStatus from "http-status";
import { generateInvoiceNumber } from "../../utils/generateInvoiceNumber";
import { generateInvoicePdf, saveInvoicePdfLocally } from "./invoice.pdf";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../error/AppError";

type GenerateInvoicePayload = {
  user: any;
  order: any;
  payment: any;
};

const formatLabel = (value?: string | null) => {
  if (!value) return "Custom";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const generateAndSaveInvoice = async ({
  user,
  order,
  payment,
}: GenerateInvoicePayload) => {
  const existingInvoice = await prisma.invoice.findUnique({
    where: {
      orderId: order.id,
    },
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const invoiceNumber = await generateInvoiceNumber();

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    orderId: order.id,
    orderDate: order.createdAt.toLocaleString(),

    customer: {
      name: order.addresses?.name || user.name,
      companyName: order.addresses?.companyName || null,
      email: order.addresses?.email || user.email,
      phone: order.addresses?.phone || null,
    },

    shippingAddress: {
      street: order.addresses?.street || "",
      houseNumber: order.addresses?.houseNumber || "",
      address: order.addresses?.address || "",
      zipCode: order.addresses?.zipCode || "",
      city: order.addresses?.city || "",
    },

    banner: {
      name: `${formatLabel(order.banner?.occasion)} Banner`,
      quantity: order.quantity,
      unitPrice: Number(order.banner?.price || 0),
      imageUrl: order.banner?.imageUrl || null,
    },

    pricing: {
      subtotal: Number(order.subtotal || 0),
      deliveryFee: Number(order.deliveryFee || 0),
      eyeletsFee: Number(order.eyeletsFee || 0),
      priceExcludingVat: Number(order.priceExcludingVat || 0),
      vatRate: Number(order.vatRate || 0.21),
      vatAmount: Number(order.vatAmount || 0),
      total: Number(order.total || 0),
    },

    payment: {
      method: "Mollie",
      transactionId: payment.transactionId,
    },
  });

  const savedPdf = await saveInvoicePdfLocally({
    pdfBuffer,
    invoiceNumber,
  });

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      invoiceUrl: savedPdf.fileUrl,
      invoiceFilePath: savedPdf.filePath,
      orderId: order.id,
      userId: user.id,
      order: order, // Add the order property
      user: user, // Add the user property
      payment: payment, // Add the payment property
      amount: Number(order.total || 0),
      vatAmount: Number(order.vatAmount || 0),
      status: "generated",
    },
  });

  return invoice;
};

export const markInvoiceAsSent = async (invoiceId: string) => {
  return prisma.invoice.update({
    where: {
      id: invoiceId,
    },
    data: {
      status: "sent",
      sentAt: new Date(),
    },
  });
};

export const getInvoiceByOrderId = async (orderId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      orderId,
    },
  });

  if (!invoice) {
    throw new AppError("Invoice not found", httpStatus.NOT_FOUND);
  }

  return invoice;
};
