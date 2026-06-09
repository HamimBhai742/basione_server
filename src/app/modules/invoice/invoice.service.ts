import httpStatus from "http-status";
import { generateInvoiceNumber } from "../../utils/generateInvoiceNumber";
import { generateInvoicePdf } from "./invoice.pdf";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../error/AppError";
import { uploadInvoicePdfToS3 } from "../../utils/savePdfInvoice";

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

const getDesignNumberFromTrackingNumber = (trackingNumber?: string | null) => {
  if (!trackingNumber) return null;

  const sequence = trackingNumber.split("-").pop();
  const numericSequence = Number(sequence);

  if (Number.isNaN(numericSequence) || numericSequence < 1) {
    return sequence || trackingNumber;
  }

  return String(numericSequence);
};

export const generateAndSaveInvoice = async ({
  user,
  order,
  payment,
}: GenerateInvoicePayload) => {
  try {
    console.log("generateAndSaveInvoice started:", {
      orderId: order?.id,
      userId: user?.id,
      paymentId: payment?.id,
    });

    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        orderId: order.id,
      },
    });

    if (existingInvoice) {
      console.log("Existing invoice found:", {
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
      });

      return existingInvoice;
    }

    const invoiceNumber = await generateInvoiceNumber();

    console.log("Invoice number generated:", invoiceNumber);

    const designNumber =
      order.banner?.designNumber ||
      getDesignNumberFromTrackingNumber(order.trackingNumber);

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber,

      orderId: order.id,

      order: {
        orderId: order.id,
        orderNumber: order.order || null,
        trackingNumber: order.trackingNumber || null,
      },

      company: {
        name: "Spandoekprint",
        street: "Neonweg 200",
        postalCity: "1362AE Almere",
        country: "Nederland",
      },

      orderDate: order.createdAt.toLocaleString(),

      customer: {
        name: order.addresses?.name || user?.name || order.guestName || "Customer",
        companyName: order.addresses?.companyName || null,
        email: order.addresses?.email || user?.email || order.guestEmail || "",
        phone: order.addresses?.phone || null,
      },

      shippingAddress: {
        companyName: order.addresses?.companyName || null,
        street: order.addresses?.street || "",
        houseNumber: order.addresses?.houseNumber || "",
        address: order.addresses?.address || "",
        zipCode: order.addresses?.zipCode || "",
        city: order.addresses?.city || "",
      },

      banner: {
        name: `${formatLabel(order.banner?.occasion)} Banner`,
        quantity: Number(order.quantity || 1),
        unitPrice: Number(order.banner?.price || 0),
        imageUrl: null,

        designType: "Uploaded / Generated design",
        designFileName: order.banner?.fileName || null,
        designNumber,
        designReference:
          designNumber ||
          order.trackingNumber ||
          order.bannerId ||
          order.banner?.id ||
          order.id,
        size: order.banner?.size || null,
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
        transactionId: payment.transactionId || payment.id || "",
      },
    });

    console.log("Invoice PDF generated:", {
      bufferSize: pdfBuffer?.length,
    });

    const savedPdf = await uploadInvoicePdfToS3({
      pdfBuffer,
      invoiceNumber,
    });

    console.log("Invoice PDF saved:", {
      fileUrl: savedPdf.fileUrl,
      filePath: savedPdf.fileName,
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceUrl: savedPdf.fileUrl,
        invoiceFilePath: savedPdf.fileName,

        orderId: order.id,
        userId: user?.id || null,

        // Uncomment only if your Invoice model has paymentId field
        paymentId: payment?.id || "",

        amount: Number(order.total || 0),
        vatAmount: Number(order.vatAmount || 0),
        status: "generated",
      },
    });

    console.log("Invoice created in database:", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    });

    return invoice;
  } catch (error: any) {
    console.error("generateAndSaveInvoice failed:", {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    throw error;
  }
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
