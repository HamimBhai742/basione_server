import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// ─── Types ────────────────────────────────────────────────────────────────────

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
    unitPrice: number; // already INCLUDING VAT
    imageUrl?: string | null;
  };
  pricing: {
    subtotal: number; // banner total including VAT
    deliveryFee: number; // including VAT
    eyeletsFee: number; // including VAT
    priceExcludingVat: number; // full order excluding VAT
    vatRate: number;
    vatAmount: number; // full order VAT amount
    total: number; // full order including VAT
  };
  payment: {
    method: string;
    transactionId: string;
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const LOGO_URL =
  "https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png";

const COLOR = {
  brand: "#17365D",
  brandDark: "#102745",
  accent: "#2563EB",
  accentLight: "#DBEAFE",
  light: "#F5F7FB",
  lightBlue: "#EFF6FF",
  grey: "#6B7280",
  muted: "#94A3B8",
  dark: "#111827",
  body: "#374151",
  divider: "#D7DEE9",
  white: "#FFFFFF",
  green: "#16A34A",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const formatVatRate = (rate: number): string => {
  if (!rate) return "21";
  return rate <= 1 ? String(Math.round(rate * 100)) : String(rate);
};

async function fetchImageBuffer(url?: string | null): Promise<Buffer | null> {
  if (!url) return null;

  try {
    if (url.includes("/uploads/")) {
      const uploadsIndex = url.indexOf("/uploads/");
      const relativePath = url.substring(uploadsIndex);
      const cleanPath = relativePath.split("?")[0];
      const localPath = path.join(process.cwd(), cleanPath);

      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
      }
    }

    let fetchUrl = url;

    if (!fetchUrl.startsWith("http")) {
      const baseUrl =
        process.env.BACKEND_BASE_URL || "https://api.spandoekprint.nl";

      fetchUrl = fetchUrl.startsWith("/")
        ? `${baseUrl}${fetchUrl}`
        : `${baseUrl}/${fetchUrl}`;
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "image/png,image/jpeg,image/jpg,image/webp,*/*",
      },
    });

    if (!res.ok) {
      console.log("Image fetch failed:", res.status, fetchUrl);
      return null;
    }

    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.startsWith("image/")) {
      console.log("Invalid image content type:", contentType, fetchUrl);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.log("Image fetch error:", error);
    return null;
  }
}

function hRule(
  doc: PDFKit.PDFDocument,
  y: number,
  color: string = COLOR.divider,
  x1 = 40,
  x2 = 555,
) {
  doc.moveTo(x1, y).lineTo(x2, y).strokeColor(color).lineWidth(0.7).stroke();
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
  doc
    .font("Helvetica-Bold")
    .fontSize(11.5)
    .fillColor(COLOR.brand)
    .text(title, 40, y);

  hRule(doc, y + 16, COLOR.accent);
}

function drawLabelValueCard(params: {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines: string[];
}) {
  const { doc, x, y, w, h, title, lines } = params;

  doc.roundedRect(x, y, w, h, 8).fill(COLOR.light);

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(COLOR.accent)
    .text(title.toUpperCase(), x + 16, y + 14);

  let currentY = y + 34;

  if (lines.length > 0) {
    lines.forEach((line, index) => {
      doc
        .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9.3)
        .fillColor(index === 0 ? COLOR.dark : COLOR.body)
        .text(line, x + 16, currentY, {
          width: w - 32,
          ellipsis: true,
        });

      currentY += 14;
    });
  } else {
    doc
      .font("Helvetica")
      .fontSize(9.3)
      .fillColor(COLOR.body)
      .text("-", x + 16, currentY);
  }
}

function pricingRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  y: number,
) {
  doc.font("Helvetica").fontSize(9.5).fillColor(COLOR.body).text(label, 48, y);

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(COLOR.dark)
    .text(value, 390, y, {
      align: "right",
      width: 155,
    });
}

function drawImageFallback(
  doc: PDFKit.PDFDocument,
  y: number,
  url?: string | null,
) {
  doc
    .roundedRect(40, y, 515, 58, 8)
    .strokeColor(COLOR.divider)
    .lineWidth(1)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLOR.grey)
    .text("Afbeelding kon niet worden geladen", 55, y + 14);

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLOR.accent)
    .text(url ?? "Geen afbeelding beschikbaar", 55, y + 31, {
      width: 480,
      ellipsis: true,
    });
}

function drawSafeText(
  doc: PDFKit.PDFDocument,
  text: string | null | undefined,
  x: number,
  y: number,
  options?: PDFKit.Mixins.TextOptions,
) {
  doc.text(text || "-", x, y, options);
}

// ─── Main PDF Generator ───────────────────────────────────────────────────────

export const generateInvoicePdf = async (
  payload: InvoicePdfPayload,
): Promise<Buffer> => {
  const [logoBuffer, bannerBuffer] = await Promise.all([
    fetchImageBuffer(LOGO_URL),
    fetchImageBuffer(payload.banner.imageUrl),
  ]);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const PAGE_W = 595;
      const PAGE_H = 842;

      // ── Page Background ────────────────────────────────────────────────────

      doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLOR.white);

      // ── Header ─────────────────────────────────────────────────────────────

      doc.rect(0, 0, PAGE_W, 104).fill(COLOR.brand);

      doc.rect(0, 0, PAGE_W, 104).fillOpacity(0.12).fill(COLOR.accent);
      doc.fillOpacity(1);

      // Logo white box
      doc.roundedRect(40, 24, 160, 50, 6).fill(COLOR.white);

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 58, 34, {
            fit: [124, 30],
            align: "center",
            valign: "center",
          });
        } catch (error) {
          console.log("Logo render failed:", error);

          doc
            .font("Helvetica-Bold")
            .fontSize(15)
            .fillColor(COLOR.brand)
            .text("Spandoek", 60, 34);

          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor(COLOR.accent)
            .text("print", 142, 51);
        }
      } else {
        doc
          .font("Helvetica-Bold")
          .fontSize(15)
          .fillColor(COLOR.brand)
          .text("Spandoek", 60, 34);

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(COLOR.accent)
          .text("print", 142, 51);
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(29)
        .fillColor(COLOR.white)
        .text("FACTUUR", 310, 24, {
          align: "right",
          width: 245,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Nr: ${payload.invoiceNumber}`, 310, 60, {
          align: "right",
          width: 245,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Order: ${payload.orderId}`, 310, 73, {
          align: "right",
          width: 245,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Datum: ${payload.orderDate}`, 310, 86, {
          align: "right",
          width: 245,
        });

      doc.rect(0, 100, PAGE_W, 4).fill(COLOR.accent);

      // ── Info Cards ─────────────────────────────────────────────────────────

      const CARD_TOP = 124;
      const CARD_H = 108;

      const customerLines = [
        payload.customer.name,
        payload.customer.companyName,
        payload.customer.email,
        payload.customer.phone,
      ].filter(Boolean) as string[];

      const addr = payload.shippingAddress;

      const addrLines = [
        `${addr.street ?? ""} ${addr.houseNumber ?? ""}`.trim(),
        addr.address,
        `${addr.zipCode ?? ""} ${addr.city ?? ""}`.trim(),
      ].filter(Boolean) as string[];

      drawLabelValueCard({
        doc,
        x: 40,
        y: CARD_TOP,
        w: 245,
        h: CARD_H,
        title: "Klantgegevens",
        lines: customerLines,
      });

      drawLabelValueCard({
        doc,
        x: 310,
        y: CARD_TOP,
        w: 245,
        h: CARD_H,
        title: "Verzendadres",
        lines: addrLines,
      });

      // ── Order Section ──────────────────────────────────────────────────────

      let y = CARD_TOP + CARD_H + 24;

      sectionTitle(doc, "BESTELLING", y);
      y += 28;

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLOR.grey)
        .text("PRODUCT", 40, y)
        .text("AANTAL", 365, y)
        .text("STUKPRIJS INCL. BTW", 405, y, {
          align: "right",
          width: 150,
        });

      y += 14;
      hRule(doc, y);
      y += 13;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLOR.dark)
        .text(payload.banner.name || "-", 40, y, {
          width: 310,
        });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLOR.body)
        .text(String(payload.banner.quantity || 0), 365, y)
        .text(formatCurrency(payload.banner.unitPrice), 405, y, {
          align: "right",
          width: 150,
        });

      y += 18;
      hRule(doc, y);
      y += 22;

      // ── Banner Image Preview ───────────────────────────────────────────────

      sectionTitle(doc, "ONTWERPVOORBEELD", y);
      y += 30;

      if (bannerBuffer) {
        try {
          doc
            .roundedRect(40, y, 515, 142, 10)
            .fillAndStroke(COLOR.white, COLOR.divider);

          doc.roundedRect(48, y + 8, 499, 126, 8).fill("#FAFBFF");

          doc.image(bannerBuffer, 48, y + 8, {
            fit: [499, 126],
            align: "center",
            valign: "center",
          });

          y += 158;
        } catch (error) {
          console.log("Banner image render failed:", error);
          drawImageFallback(doc, y, payload.banner.imageUrl);
          y += 76;
        }
      } else if (payload.banner.imageUrl) {
        drawImageFallback(doc, y, payload.banner.imageUrl);
        y += 76;
      } else {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(COLOR.grey)
          .text("Geen afbeelding beschikbaar.", 40, y);

        y += 24;
      }

      // ── Pricing Section ────────────────────────────────────────────────────

      y += 4;

      sectionTitle(doc, "PRIJSBEREKENING", y);
      y += 30;

      const vatRate = formatVatRate(payload.pricing.vatRate);

      /**
       * Important:
       * All prices are already including VAT.
       * We do not add VAT again.
       * priceExcludingVat and vatAmount should come from backend as full order breakdown:
       * banner + delivery + eyelets.
       */
      const priceRows: [string, number][] = [
        ["Spandoek incl. BTW", payload.pricing.subtotal],
        ["Levering / Afhalen incl. BTW", payload.pricing.deliveryFee],
        ["Ringen / Eyelets incl. BTW", payload.pricing.eyeletsFee],
        [`Totaal excl. ${vatRate}% BTW`, payload.pricing.priceExcludingVat],
        [`BTW ${vatRate}% inbegrepen`, payload.pricing.vatAmount],
      ];

      priceRows.forEach(([label, amount]) => {
        pricingRow(doc, label, formatCurrency(amount), y);
        y += 15;
      });

      y += 2;
      hRule(doc, y);
      y += 9;

      doc.roundedRect(40, y, 515, 34, 6).fill(COLOR.brand);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.white)
        .text("Totaal incl. BTW", 56, y + 11);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.white)
        .text(formatCurrency(payload.pricing.total), 390, y + 11, {
          align: "right",
          width: 150,
        });

      y += 45;

      doc
        .font("Helvetica")
        .fontSize(7.8)
        .fillColor(COLOR.grey)
        .text(
          `Alle bedragen zijn inclusief ${vatRate}% BTW. De BTW is berekend over het spandoek, levering/afhalen en ringen/eyelets.`,
          48,
          y,
          {
            width: 500,
            lineGap: 2,
          },
        );

      y += 38;

      // ── Footer ─────────────────────────────────────────────────────────────

      doc.rect(0, PAGE_H - 46, PAGE_W, 46).fill(COLOR.brand);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(
          "Bedankt voor uw bestelling bij Spandoek Print · Vragen? Neem gerust contact met ons op.",
          40,
          PAGE_H - 28,
          {
            align: "center",
            width: PAGE_W - 80,
          },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ─── Save PDF Locally ─────────────────────────────────────────────────────────

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
