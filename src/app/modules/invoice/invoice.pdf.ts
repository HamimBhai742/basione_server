import PDFDocument from "pdfkit";

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
  brandDark: "#102745",
  accent: "#2563EB",
  accentSoft: "#EAF2FF",
  light: "#F8FAFC",
  light2: "#F1F5F9",
  grey: "#64748B",
  muted: "#94A3B8",
  dark: "#0F172A",
  body: "#334155",
  divider: "#D9E2EC",
  white: "#FFFFFF",
  green: "#16A34A",
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

// Section title with underline accent — compact version (15px underline gap)
function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLOR.brand)
    .text(title.toUpperCase(), 40, y);

  doc.roundedRect(40, y + 15, 515, 2, 1).fill(COLOR.accentSoft);
  doc.roundedRect(40, y + 15, 82, 2, 1).fill(COLOR.accent);
}

// Card with two size modes: normal (h≥80) and compact (h<80)
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
  doc.roundedRect(x, y, w, h, 10).strokeColor(COLOR.divider).lineWidth(0.7).stroke();

  const titleY = compact ? y + 10 : y + 12;
  doc
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .fillColor(COLOR.accent)
    .text(title.toUpperCase(), x + 16, titleY);

  let currentY = compact ? y + 24 : y + 28;

  lines.forEach((line, index) => {
    doc
      .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(index === 0 ? 9 : 8.2)
      .fillColor(index === 0 ? COLOR.dark : COLOR.body)
      .text(line, x + 16, currentY, { width: w - 32, ellipsis: true });

    currentY += compact ? 12 : 13;
  });
}

// Pricing row
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
    .text(value, 392, y, { align: "right", width: 145 });
}

// Summary pill — height 34px (was 40px)
function drawInfoPill(params: {
  doc: PDFKit.PDFDocument;
  x: number;
  y: number;
  label: string;
  value: string;
}) {
  const { doc, x, y, label, value } = params;

  doc.roundedRect(x, y, 160, 34, 8).fill(COLOR.white);
  doc.roundedRect(x, y, 160, 34, 8).strokeColor("#CFE0F5").lineWidth(0.7).stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor(COLOR.grey)
    .text(label.toUpperCase(), x + 12, y + 8);

  doc
    .font("Helvetica-Bold")
    .fontSize(8.2)
    .fillColor(COLOR.dark)
    .text(value, x + 12, y + 20, { width: 136, ellipsis: true });
}

// ─── Main PDF Generator ───────────────────────────────────────────────────────
//
// One-page A4 layout — vertical budget:
//   Header        0–100    (100 px)
//   Pills       116–150    ( 34 px)
//   Cards       158–244    ( 86 px)
//   Order       256–376    ( 96 px table + 24 title)
//   Pricing     396–576    (156 px box  + 24 title)
//   Payment     596–672    ( 52 px cards + 24 title)
//   Note        686–722    ( 36 px)
//   Footer      790–842    ( 52 px)
//
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

      // ── Background ─────────────────────────────────────────────────────────
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLOR.white);

      // ── Header (0–100) ─────────────────────────────────────────────────────
      doc.rect(0, 0, PAGE_W, 100).fill(COLOR.brand);
      doc.rect(0, 96, PAGE_W, 4).fill(COLOR.accent);

      // Brand box
      doc.roundedRect(40, 22, 168, 48, 8).fill(COLOR.white);

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor(COLOR.brand)
        .text("Spandoek", 56, 32);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.accent)
        .text("Print", 142, 47);

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(COLOR.grey)
        .text("Professionele spandoeken op maat", 56, 58, {
          width: 134,
          ellipsis: true,
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(26)
        .fillColor(COLOR.white)
        .text("FACTUUR", 310, 22, { align: "right", width: 245 });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Factuurnummer: ${payload.invoiceNumber}`, 310, 56, {
          align: "right",
          width: 245,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Order ID: ${payload.orderId}`, 310, 68, {
          align: "right",
          width: 245,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DCE7F7")
        .text(`Datum: ${payload.orderDate}`, 310, 80, {
          align: "right",
          width: 245,
        });

      // ── Summary Pills (116–150) ─────────────────────────────────────────────
      drawInfoPill({ doc, x: 40,  y: 116, label: "Betaalmethode",   value: safeText(payload.payment.method) });
      drawInfoPill({ doc, x: 217, y: 116, label: "Status",          value: "Betaald" });
      drawInfoPill({ doc, x: 395, y: 116, label: "Totaal incl. BTW", value: formatCurrency(payload.pricing.total) });

      // ── Customer & Address Cards (158–244) ─────────────────────────────────
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

      drawCard({ doc, x: 40,  y: 158, w: 245, h: 86, title: "Klantgegevens", lines: customerLines });
      drawCard({ doc, x: 310, y: 158, w: 245, h: 86, title: "Verzendadres",  lines: addrLines });

      // ── Order Section (256–376) ────────────────────────────────────────────
      let y = 256;

      sectionTitle(doc, "Bestelling", y);
      y += 24; // y = 280

      // Table box (h = 96)
      doc.roundedRect(40, y, 515, 96, 10).fill(COLOR.light);
      doc.roundedRect(40, y, 515, 96, 10).strokeColor(COLOR.divider).lineWidth(0.7).stroke();

      const tableTop = y + 14; // 294

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(COLOR.grey)
        .text("PRODUCT", 56, tableTop)
        .text("AANTAL", 355, tableTop)
        .text("STUKPRIJS INCL. BTW", 416, tableTop, { align: "right", width: 120 });

      hRule(doc, tableTop + 14, COLOR.divider, 56, 539); // 308

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

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(COLOR.muted)
        .text(
          "Ontwerpvoorbeeld is niet toegevoegd aan deze factuur zodat de factuur sneller gegenereerd en verzonden kan worden.",
          56,
          tableTop + 57,
          { width: 470, lineGap: 1 },
        );

      y += 116; // 280 + 116 = 396  (96 box + 20 gap)

      // ── Pricing Section (396–576) ──────────────────────────────────────────
      sectionTitle(doc, "Prijsberekening", y); // at 396
      y += 24; // y = 420

      // Box (h = 156)
      doc.roundedRect(40, y, 515, 156, 10).fill(COLOR.white);
      doc.roundedRect(40, y, 515, 156, 10).strokeColor(COLOR.divider).lineWidth(0.7).stroke();

      let priceY = y + 16; // 436
      const vatRate = formatVatRate(payload.pricing.vatRate);

      const priceRows: [string, number, boolean?][] = [
        ["Spandoek incl. BTW",            payload.pricing.subtotal],
        ["Levering / Afhalen incl. BTW",  payload.pricing.deliveryFee],
        ["Ringen / Eyelets incl. BTW",    payload.pricing.eyeletsFee],
        [`Totaal excl. ${vatRate}% BTW`,  payload.pricing.priceExcludingVat],
        [`BTW ${vatRate}% inbegrepen`,    payload.pricing.vatAmount],
      ];

      priceRows.forEach(([label, amount, bold]) => {
        pricingRow({ doc, label, value: formatCurrency(amount), y: priceY, bold });
        priceY += 16; // rows at 16 px spacing
      });
      // priceY = 436 + 5×16 = 516

      hRule(doc, priceY + 2, COLOR.divider, 56, 539); // 518

      // Total bar
      doc.roundedRect(56, priceY + 12, 483, 36, 8).fill(COLOR.brand); // 528–564

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.white)
        .text("Totaal incl. BTW", 72, priceY + 24); // 540

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.white)
        .text(formatCurrency(payload.pricing.total), 392, priceY + 24, {
          align: "right",
          width: 130,
        });

      y += 176; // 420 + 176 = 596  (156 box + 20 gap)

      // ── Payment Section (596–672) ──────────────────────────────────────────
      sectionTitle(doc, "Betaling", y); // at 596
      y += 24; // y = 620

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

      y += 66; // 620 + 66 = 686  (52 card + 14 gap)

      // ── Note (686–722) ─────────────────────────────────────────────────────
      doc.roundedRect(40, y, 515, 36, 8).fill(COLOR.accentSoft);

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLOR.body)
        .text(
          `Alle bedragen zijn inclusief ${vatRate}% BTW. De BTW is berekend over het spandoek, levering/afhalen en ringen/eyelets.`,
          56,
          y + 12,
          { width: 480, lineGap: 1 },
        );

      // ── Footer (790–842) ───────────────────────────────────────────────────
      doc.rect(0, PAGE_H - 52, PAGE_W, 52).fill(COLOR.brand);

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(COLOR.white)
        .text("Spandoek Print", 40, PAGE_H - 36, {
          align: "center",
          width: PAGE_W - 80,
        });

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor("#DCE7F7")
        .text(
          "Bedankt voor uw bestelling. Heeft u vragen? Neem gerust contact met ons op.",
          40,
          PAGE_H - 22,
          { align: "center", width: PAGE_W - 80 },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};