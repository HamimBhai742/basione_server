import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

type InvoicePdfPayload = {
  invoiceNumber: string;
  orderId: string;
  orderDate: string;
  customer: {
    name: string;
    companyName?: string | null;
    email: string;
    phone?: string | null;
  };
  shippingAddress: {
    street?: string | null;
    houseNumber?: string | null;
    address?: string | null;
    zipCode?: string | null;
    city?: string | null;
  };
  banner: {
    name: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string | null;
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    eyeletsFee: number;
    priceExcludingVat: number;
    vatRate: number;
    vatAmount: number;
    total: number;
  };
  payment: {
    method: string;
    transactionId: string;
  };
};

const formatCurrency = (amount: number) => {
  return `€${Number(amount || 0).toFixed(2)}`;
};

const addRow = (
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  y: number,
  bold = false,
) => {
  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(10)
    .fillColor("#111827")
    .text(label, 50, y);

  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .text(value, 400, y, {
      align: "right",
      width: 140,
    });
};

export const generateInvoicePdf = async (
  payload: InvoicePdfPayload,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fillColor("#111827")
        .text("Factuur", 50, 50);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#6B7280")
        .text(`Factuurnummer: ${payload.invoiceNumber}`, 50, 85)
        .text(`Order ID: ${payload.orderId}`, 50, 100)
        .text(`Datum: ${payload.orderDate}`, 50, 115);

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#111827")
        .text("Spandoek Print", 380, 50, {
          align: "right",
          width: 160,
        });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#6B7280")
        .text("Nederland", 380, 72, {
          align: "right",
          width: 160,
        });

      doc.moveTo(50, 145).lineTo(545, 145).strokeColor("#E5E7EB").stroke();

      // Customer info
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#111827")
        .text("Klantgegevens", 50, 170);

      let customerY = 195;

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#374151")
        .text(`Naam: ${payload.customer.name}`, 50, customerY);

      customerY += 16;

      if (payload.customer.companyName) {
        doc.text(`Bedrijfsnaam: ${payload.customer.companyName}`, 50, customerY);
        customerY += 16;
      }

      doc.text(`E-mail: ${payload.customer.email}`, 50, customerY);
      customerY += 16;

      if (payload.customer.phone) {
        doc.text(`Telefoon: ${payload.customer.phone}`, 50, customerY);
        customerY += 16;
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#111827")
        .text("Adres", 320, 170);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#374151")
        .text(
          `${payload.shippingAddress.street || ""} ${
            payload.shippingAddress.houseNumber || ""
          }`,
          320,
          195,
        )
        .text(payload.shippingAddress.address || "", 320, 211)
        .text(
          `${payload.shippingAddress.zipCode || ""} ${
            payload.shippingAddress.city || ""
          }`,
          320,
          227,
        );

      doc.moveTo(50, 270).lineTo(545, 270).strokeColor("#E5E7EB").stroke();

      // Product
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#111827")
        .text("Bestelling", 50, 295);

      const tableTop = 325;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111827")
        .text("Product", 50, tableTop)
        .text("Aantal", 300, tableTop)
        .text("Prijs", 400, tableTop, {
          align: "right",
          width: 140,
        });

      doc.moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).strokeColor("#E5E7EB").stroke();

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#374151")
        .text(payload.banner.name, 50, tableTop + 35)
        .text(String(payload.banner.quantity), 300, tableTop + 35)
        .text(formatCurrency(payload.banner.unitPrice), 400, tableTop + 35, {
          align: "right",
          width: 140,
        });

      // Design preview image
      const previewTop = tableTop + 80;

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#111827")
        .text("Ontwerpvoorbeeld", 50, previewTop);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text(
          "Het voorbeeld van het ontwerp/de bestelling wordt hieronder weergegeven.",
          50,
          previewTop + 20,
        );

      // Note: pdfkit cannot directly load remote image URL without fetching it.
      // For remote images, download the image first as Buffer, then doc.image(buffer).
      // Here we show image URL as fallback.
      if (payload.banner.imageUrl) {
        doc
          .roundedRect(50, previewTop + 45, 220, 90, 8)
          .strokeColor("#D1D5DB")
          .stroke();

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#2563EB")
          .text(payload.banner.imageUrl, 60, previewTop + 80, {
            width: 200,
          });
      }

      // Pricing
      const priceY = previewTop + 165;

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#111827")
        .text("Prijsberekening", 50, priceY);

      addRow(doc, "Subtotaal", formatCurrency(payload.pricing.subtotal), priceY + 30);
      addRow(doc, "Levering / Afhalen", formatCurrency(payload.pricing.deliveryFee), priceY + 50);
      addRow(doc, "Ringen / Eyelets", formatCurrency(payload.pricing.eyeletsFee), priceY + 70);
      addRow(
        doc,
        "Prijs excl. 21% BTW",
        formatCurrency(payload.pricing.priceExcludingVat),
        priceY + 90,
      );
      addRow(doc, "BTW 21%", formatCurrency(payload.pricing.vatAmount), priceY + 110);

      doc.moveTo(50, priceY + 135).lineTo(545, priceY + 135).strokeColor("#E5E7EB").stroke();

      addRow(doc, "Totaal incl. BTW", formatCurrency(payload.pricing.total), priceY + 150, true);

      // Payment
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#111827")
        .text("Betaling", 50, priceY + 190);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#374151")
        .text(`Betaalmethode: ${payload.payment.method}`, 50, priceY + 215)
        .text(`Transactie ID: ${payload.payment.transactionId}`, 50, priceY + 231);

      // Footer
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text(
          "Bedankt voor uw bestelling. Neem contact op met onze klantenservice als u vragen heeft over deze factuur.",
          50,
          760,
          {
            align: "center",
            width: 495,
          },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const saveInvoicePdfLocally = async ({
  pdfBuffer,
  invoiceNumber,
}: {
  pdfBuffer: Buffer;
  invoiceNumber: string;
}) => {
  const uploadDir = path.join(process.cwd(), "uploads", "invoices");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
      recursive: true,
    });
  }

  const fileName = `${invoiceNumber}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  await fs.promises.writeFile(filePath, pdfBuffer);

  const backendBaseUrl =
    process.env.BACKEND_BASE_URL || "https://api.spandoekprint.nl";

  const fileUrl = `${backendBaseUrl}/uploads/invoices/${fileName}`;

  return {
    fileName,
    filePath,
    fileUrl,
  };
};