import PDFDocument from "pdfkit";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoicePdfPayload = {
  invoiceNumber: string;
  orderId: string;
  orderDate: string;

  order?: {
    orderId?: string;
    orderNumber?: string | null;
    trackingNumber?: string | null;
  };

  company?: {
    name: string;
    street: string;
    postalCity: string;
    country: string;
  };

  customer: {
    name: string;
    companyName?: string | null;
    email: string;
    phone?: string | null;
  };

  shippingAddress: {
    companyName?: string | null;
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

    designType?: string | null;
    designFileName?: string | null;
    designReference?: string | null;
    size?: string | null;
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

// ─── Colors ───────────────────────────────────────────────────────────────────

const COLOR = {
  brand: "#17365D",
  accent: "#2563EB",
  accentSoft: "#EAF2FF",
  light: "#F8FAFC",
  grey: "#64748B",
  muted: "#94A3B8",
  dark: "#0F172A",
  body: "#334155",
  divider: "#D9E2EC",
  white: "#FFFFFF",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatVatRate = (rate: number): string => {
  if (!rate) return "21";
  return rate <= 1 ? String(Math.round(rate * 100)) : String(rate);
};

const safeText = (value?: string | null) =>
  value && String(value).trim() ? String(value).trim() : "-";

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
    .fontSize(10)
    .fillColor(COLOR.brand)
    .text(title.toUpperCase(), 40, y);

  doc.roundedRect(40, y + 15, 515, 2, 1).fill(COLOR.accentSoft);
  doc.roundedRect(40, y + 15, 82, 2, 1).fill(COLOR.accent);
}

function drawCard(params: {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines: string[];
}) {
  const { doc, x, y, w, h, title, lines } = params;
  const compact = h < 70;

  doc.roundedRect(x, y, w, h, 10).fill(COLOR.light);
  doc
    .roundedRect(x, y, w, h, 10)
    .strokeColor(COLOR.divider)
    .lineWidth(0.7)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .fillColor(COLOR.accent)
    .text(title.toUpperCase(), x + 16, compact ? y + 10 : y + 12);

  let currentY = compact ? y + 24 : y + 28;

  lines.forEach((line, index) => {
    doc
      .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(index === 0 ? 9 : 8.2)
      .fillColor(index === 0 ? COLOR.dark : COLOR.body)
      .text(safeText(line), x + 16, currentY, {
        width: w - 32,
        ellipsis: true,
      });

    currentY += compact ? 12 : 13;
  });
}

function pricingRow(params: {
  doc: PDFKit.PDFDocument;
  label: string;
  value: string;
  y: number;
  bold?: boolean;
}) {
  const { doc, label, value, y, bold = false } = params;

  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(9)
    .fillColor(bold ? COLOR.dark : COLOR.body)
    .text(label, 56, y);

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLOR.dark)
    .text(value, 392, y, {
      align: "right",
      width: 145,
    });
}

function drawInfoPill(params: {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  label: string;
  value: string;
}) {
  const { doc, x, y, label, value } = params;

  doc.roundedRect(x, y, 160, 34, 8).fill(COLOR.white);
  doc
    .roundedRect(x, y, 160, 34, 8)
    .strokeColor("#CFE0F5")
    .lineWidth(0.7)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor(COLOR.grey)
    .text(label.toUpperCase(), x + 12, y + 8);

  doc
    .font("Helvetica-Bold")
    .fontSize(8.2)
    .fillColor(COLOR.dark)
    .text(value, x + 12, y + 20, {
      width: 136,
      ellipsis: true,
    });
}

// ─── Main PDF Generator ───────────────────────────────────────────────────────

export const generateInvoicePdf = async (
  payload: InvoicePdfPayload,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        bufferPages: false,
        autoFirstPage: true,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const PAGE_W = 595;
      const PAGE_H = 842;
      const HEADER_H = 105;

      const company = payload.company || {
        name: "Spandoekprint",
        street: "Neonweg 200",
        postalCity: "1362AE Almere",
        country: "Nederland",
      };

      const displayOrderNumber =
        payload.order?.trackingNumber ||
        payload.order?.orderNumber ||
        payload.order?.orderId ||
        payload.orderId;

      const designReference =
        payload.banner.designReference ||
        payload.order?.trackingNumber ||
        payload.order?.orderNumber ||
        payload.orderId;

      const designFileName = payload.banner.designFileName || "Niet toegevoegd";
      const designType = payload.banner.designType || "Ontwerp referentie";
      const bannerSize = payload.banner.size || "Maatwerk formaat";

      // ── Background ─────────────────────────────────────────────────────────
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLOR.white);

      // ── Header: NO LOGO, NO WHITE BOX ──────────────────────────────────────
      doc.rect(0, 0, PAGE_W, HEADER_H).fill(COLOR.brand);
      doc.rect(0, HEADER_H - 5, PAGE_W, 5).fill(COLOR.accent);

      // Company info only
      doc
        .font("Helvetica-Bold")
        .fontSize(17)
        .fillColor(COLOR.white)
        .text(company.name, 40, 23, {
          width: 250,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#DCE7F7")
        .text(company.street, 40, 49, {
          width: 250,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#DCE7F7")
        .text(company.postalCity, 40, 64, {
          width: 250,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#DCE7F7")
        .text(company.country, 40, 79, {
          width: 250,
          ellipsis: true,
        });

      // Invoice info right side
      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor(COLOR.white)
        .text("FACTUUR", 310, 23, {
          align: "right",
          width: 245,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Factuurnummer: ${payload.invoiceNumber}`, 310, 59, {
          align: "right",
          width: 245,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Order Ref: ${displayOrderNumber}`, 310, 73, {
          align: "right",
          width: 245,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Datum: ${payload.orderDate}`, 310, 87, {
          align: "right",
          width: 245,
        });

      // ── Summary Pills ──────────────────────────────────────────────────────
      drawInfoPill({
        doc,
        x: 40,
        y: 120,
        label: "Betaalmethode",
        value: safeText(payload.payment.method),
      });

      drawInfoPill({
        doc,
        x: 217,
        y: 120,
        label: "Status",
        value: "Betaald",
      });

      drawInfoPill({
        doc,
        x: 395,
        y: 120,
        label: "Totaal incl. BTW",
        value: formatCurrency(payload.pricing.total),
      });

      // ── Customer & Address Cards ───────────────────────────────────────────
      const customerLines = [
        payload.customer.name,
        payload.customer.companyName,
        payload.customer.email,
        payload.customer.phone,
      ].filter(Boolean) as string[];

      const addr = payload.shippingAddress;

      const addrLines = [
        addr.companyName,
        `${addr.street ?? ""} ${addr.houseNumber ?? ""}`.trim(),
        addr.address,
        `${addr.zipCode ?? ""} ${addr.city ?? ""}`.trim(),
      ].filter(Boolean) as string[];

      drawCard({
        doc,
        x: 40,
        y: 162,
        w: 245,
        h: 86,
        title: "Klantgegevens",
        lines: customerLines,
      });

      drawCard({
        doc,
        x: 310,
        y: 162,
        w: 245,
        h: 86,
        title: "Verzendadres",
        lines: addrLines,
      });

      // ── Order Section ──────────────────────────────────────────────────────
      let y = 260;

      sectionTitle(doc, "Bestelling", y);
      y += 24;

      doc.roundedRect(40, y, 515, 112, 10).fill(COLOR.light);
      doc
        .roundedRect(40, y, 515, 112, 10)
        .strokeColor(COLOR.divider)
        .lineWidth(0.7)
        .stroke();

      const tableTop = y + 14;

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(COLOR.grey)
        .text("PRODUCT", 56, tableTop)
        .text("AANTAL", 355, tableTop)
        .text("STUKPRIJS INCL. BTW", 416, tableTop, {
          align: "right",
          width: 120,
        });

      hRule(doc, tableTop + 14, COLOR.divider, 56, 539);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLOR.dark)
        .text(safeText(payload.banner.name), 56, tableTop + 27, {
          width: 280,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(7.8)
        .fillColor(COLOR.grey)
        .text("Spandoek op maat", 56, tableTop + 40, {
          width: 280,
          ellipsis: true,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLOR.body)
        .text(String(payload.banner.quantity || 1), 365, tableTop + 30);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLOR.dark)
        .text(formatCurrency(payload.banner.unitPrice), 416, tableTop + 30, {
          align: "right",
          width: 120,
        });

      // Design / Order reference area
      doc
        .font("Helvetica-Bold")
        .fontSize(7.3)
        .fillColor(COLOR.brand)
        .text("Order / Design referentie", 56, tableTop + 58, {
          width: 180,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(7.1)
        .fillColor(COLOR.grey)
        .text(`Order referentie: ${safeText(displayOrderNumber)}`, 56, tableTop + 72, {
          width: 230,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(7.1)
        .fillColor(COLOR.grey)
        .text(`Design referentie: ${safeText(designReference)}`, 56, tableTop + 84, {
          width: 230,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(7.1)
        .fillColor(COLOR.grey)
        .text(`Type: ${safeText(designType)}`, 300, tableTop + 60, {
          width: 230,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(7.1)
        .fillColor(COLOR.grey)
        .text(`Formaat: ${safeText(bannerSize)}`, 300, tableTop + 72, {
          width: 230,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(7.1)
        .fillColor(COLOR.grey)
        .text(`Design bestand: ${safeText(designFileName)}`, 300, tableTop + 84, {
          width: 230,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(COLOR.muted)
        .text(
          "Het volledige ontwerpbestand is niet toegevoegd aan deze factuur om de factuur snel en betrouwbaar te genereren.",
          56,
          tableTop + 99,
          {
            width: 470,
            lineGap: 1,
          },
        );

      y += 132;

      // ── Pricing Section ────────────────────────────────────────────────────
      sectionTitle(doc, "Prijsberekening", y);
      y += 24;

      doc.roundedRect(40, y, 515, 156, 10).fill(COLOR.white);
      doc
        .roundedRect(40, y, 515, 156, 10)
        .strokeColor(COLOR.divider)
        .lineWidth(0.7)
        .stroke();

      let priceY = y + 16;
      const vatRate = formatVatRate(payload.pricing.vatRate);

      const priceRows: [string, number][] = [
        ["Spandoek incl. BTW", payload.pricing.subtotal],
        ["Levering / Afhalen incl. BTW", payload.pricing.deliveryFee],
        ["Ringen / Eyelets incl. BTW", payload.pricing.eyeletsFee],
        [`Totaal excl. ${vatRate}% BTW`, payload.pricing.priceExcludingVat],
        [`BTW ${vatRate}% inbegrepen`, payload.pricing.vatAmount],
      ];

      priceRows.forEach(([label, amount]) => {
        pricingRow({
          doc,
          label,
          value: formatCurrency(amount),
          y: priceY,
        });

        priceY += 16;
      });

      hRule(doc, priceY + 2, COLOR.divider, 56, 539);

      doc.roundedRect(56, priceY + 12, 483, 36, 8).fill(COLOR.brand);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.white)
        .text("Totaal incl. BTW", 72, priceY + 24);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.white)
        .text(formatCurrency(payload.pricing.total), 392, priceY + 24, {
          align: "right",
          width: 130,
        });

      y += 176;

      // ── Payment Section ────────────────────────────────────────────────────
      sectionTitle(doc, "Betaling", y);
      y += 24;

      drawCard({
        doc,
        x: 40,
        y,
        w: 245,
        h: 52,
        title: "Betaalmethode",
        lines: [safeText(payload.payment.method)],
      });

      drawCard({
        doc,
        x: 310,
        y,
        w: 245,
        h: 52,
        title: "Transactie ID",
        lines: [safeText(payload.payment.transactionId)],
      });

      y += 66;

      // ── Note ───────────────────────────────────────────────────────────────
      doc.roundedRect(40, y, 515, 36, 8).fill(COLOR.accentSoft);

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLOR.body)
        .text(
          `Alle bedragen zijn inclusief ${vatRate}% BTW. De BTW is berekend over het spandoek, levering/afhalen en ringen/eyelets.`,
          56,
          y + 12,
          {
            width: 480,
            lineGap: 1,
          },
        );

      // ── Footer ─────────────────────────────────────────────────────────────
      doc.rect(0, PAGE_H - 52, PAGE_W, 52).fill(COLOR.brand);

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(COLOR.white)
        .text(company.name, 40, PAGE_H - 38, {
          align: "center",
          width: PAGE_W - 80,
        });

      doc
        .font("Helvetica")
        .fontSize(7.3)
        .fillColor("#DCE7F7")
        .text(`${company.street} • ${company.postalCity} • ${company.country}`, 40, PAGE_H - 26, {
          align: "center",
          width: PAGE_W - 80,
        });

      doc
        .font("Helvetica")
        .fontSize(7.3)
        .fillColor("#DCE7F7")
        .text(
          "Bedankt voor uw bestelling. Heeft u vragen? Neem gerust contact met ons op.",
          40,
          PAGE_H - 14,
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
