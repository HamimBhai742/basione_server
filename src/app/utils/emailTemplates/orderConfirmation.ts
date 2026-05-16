import { OrderConfirmedEmailData } from "../../../type/interface";
import sendEmail from "./nodemailerTransport";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const safeText = (value?: string | null) => {
  return value && value.trim() ? value : "-";
};

export const orderConfirmedTemplate = async (data: OrderConfirmedEmailData) => {
  const subject = `Bestelling bevestigd - ${data.orderId}`;

  const vatPercent = Math.round((data.vatRate || 0.21) * 100);

  const deliveryAddress = `
    ${safeText(data.shippingAddress.name)}<br/>
    ${
      data.shippingAddress.companyName
        ? `${data.shippingAddress.companyName}<br/>`
        : ""
    }
    ${safeText(data.shippingAddress.street)} ${safeText(data.shippingAddress.houseNumber)}<br/>
    ${
      data.shippingAddress.address
        ? `${data.shippingAddress.address}<br/>`
        : ""
    }
    ${safeText(data.shippingAddress.zipCode)} ${safeText(data.shippingAddress.city)}<br/>
    ${
      data.shippingAddress.phone
        ? `Tel: ${data.shippingAddress.phone}<br/>`
        : ""
    }
    ${
      data.shippingAddress.email
        ? `Email: ${data.shippingAddress.email}`
        : ""
    }
  `;

  const itemsHtml = data.items
    .map(
      (item) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
        border: 1px solid #dbeafe;
        border-radius: 12px;
        margin-bottom: 14px;
        background: #ffffff;
      ">
        <tr>
          ${
            item.imageUrl
              ? `
          <td width="92" valign="top" style="padding: 16px;">
            <img
              src="${item.imageUrl}"
              alt="${item.name}"
              width="76"
              height="76"
              style="
                width: 76px;
                height: 76px;
                object-fit: cover;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                display: block;
              "
            />
          </td>
          `
              : ""
          }

          <td valign="top" style="padding: 16px ${
            item.imageUrl ? "16px 16px 0" : "16px"
          };">
            <p style="
              margin: 0 0 6px;
              font-size: 15px;
              line-height: 1.4;
              color: #0f172a;
              font-weight: 700;
            ">${item.name}</p>

            <p style="
              margin: 0 0 4px;
              font-size: 13px;
              line-height: 1.5;
              color: #64748b;
            ">Aantal: ${item.quantity}</p>

            <p style="
              margin: 0 0 4px;
              font-size: 13px;
              line-height: 1.5;
              color: #64748b;
            ">Prijs per stuk incl. BTW: ${formatCurrency(item.price)}</p>

            <p style="
              margin: 6px 0 0;
              font-size: 14px;
              line-height: 1.5;
              color: #1d4ed8;
              font-weight: 700;
            ">Totaal incl. BTW: ${formatCurrency(item.price * item.quantity)}</p>
          </td>
        </tr>
      </table>
    `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bestelling bevestigd</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #eef2f7;
  font-family: Arial, Helvetica, sans-serif;
">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
    background-color: #eef2f7;
    padding: 32px 12px;
  ">
    <tr>
      <td align="center">

        <table width="620" cellpadding="0" cellspacing="0" border="0" style="
          width: 100%;
          max-width: 620px;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.10);
        ">

          <!-- Header -->
          <tr>
            <td align="center" style="
              background: #0f1f3d;
              padding: 34px 28px 32px;
            ">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="
                    background: #ffffff;
                    border-radius: 10px;
                    padding: 10px 18px;
                  ">
                    <img
                      src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
                      alt="Spandoek Print"
                      width="150"
                      style="
                        display: block;
                        width: 150px;
                        height: auto;
                      "
                    />
                  </td>
                </tr>
              </table>

              <div style="
                margin-top: 22px;
                display: inline-block;
                background: rgba(59,130,246,0.20);
                border: 1px solid rgba(147,197,253,0.45);
                color: #bfdbfe;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                padding: 7px 14px;
                border-radius: 999px;
              ">
                Betaling ontvangen
              </div>

              <h1 style="
                margin: 18px 0 8px;
                font-size: 25px;
                line-height: 1.3;
                color: #ffffff;
                font-weight: 700;
              ">
                Bestelling bevestigd
              </h1>

              <p style="
                margin: 0;
                font-size: 14px;
                line-height: 1.7;
                color: #cbd5e1;
              ">
                Bedankt voor uw bestelling. Wij gaan er direct mee aan de slag.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 34px 34px 36px;">

              <p style="
                margin: 0 0 10px;
                font-size: 16px;
                line-height: 1.6;
                color: #334155;
              ">
                Hallo <strong style="color:#0f172a;">${data.userName}</strong>,
              </p>

              <p style="
                margin: 0 0 28px;
                font-size: 14px;
                line-height: 1.8;
                color: #64748b;
              ">
                Uw bestelling is succesvol geplaatst en wordt nu verwerkt door ons team.
                Hieronder vindt u een volledig overzicht van uw order.
              </p>

              <!-- Order Info -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                margin-bottom: 32px;
              ">
                <tr>
                  <td style="padding: 22px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" valign="top" style="padding: 0 10px 16px 0;">
                          <p style="margin:0 0 5px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Order ID</p>
                          <p style="margin:0;font-size:13px;line-height:1.5;color:#1d4ed8;font-weight:700;word-break:break-word;">${data.orderId}</p>
                        </td>

                        <td width="50%" valign="top" style="padding: 0 0 16px 10px;">
                          <p style="margin:0 0 5px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Orderdatum</p>
                          <p style="margin:0;font-size:13px;line-height:1.5;color:#0f172a;font-weight:700;">${data.orderDate}</p>
                        </td>
                      </tr>

                      <tr>
                        <td width="50%" valign="top" style="padding: 0 10px 16px 0;">
                          <p style="margin:0 0 5px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Betaalmethode</p>
                          <p style="margin:0;font-size:13px;line-height:1.5;color:#0f172a;font-weight:700;">${data.paymentMethod}</p>
                        </td>

                        <td width="50%" valign="top" style="padding: 0 0 16px 10px;">
                          <p style="margin:0 0 5px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Geschatte levering</p>
                          <p style="margin:0;font-size:13px;line-height:1.5;color:#0f172a;font-weight:700;">${safeText(data.estimatedDelivery)}</p>
                        </td>
                      </tr>

                      ${
                        data.invoiceNumber
                          ? `
                      <tr>
                        <td colspan="2" valign="top" style="padding: 0;">
                          <p style="margin:0 0 5px;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Factuurnummer</p>
                          <p style="margin:0;font-size:13px;line-height:1.5;color:#0f172a;font-weight:700;">${data.invoiceNumber}</p>
                        </td>
                      </tr>
                          `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items -->
              <p style="
                margin: 0 0 14px;
                font-size: 16px;
                line-height: 1.4;
                color: #0f172a;
                font-weight: 700;
              ">
                Bestelde items
              </p>

              ${itemsHtml}

              <!-- Divider -->
              <div style="
                height: 1px;
                background: #e5e7eb;
                margin: 30px 0;
              "></div>

              <!-- Price Summary -->
              <p style="
                margin: 0 0 14px;
                font-size: 16px;
                line-height: 1.4;
                color: #0f172a;
                font-weight: 700;
              ">
                Prijsberekening
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                overflow: hidden;
                margin-bottom: 10px;
              ">
                <tr>
                  <td style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#475569;">Spandoek incl. BTW</td>
                  <td align="right" style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;font-weight:700;">${formatCurrency(data.subtotal)}</td>
                </tr>

                <tr>
                  <td style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#475569;">Levering / Afhalen incl. BTW</td>
                  <td align="right" style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;font-weight:700;">${formatCurrency(data.deliveryFee)}</td>
                </tr>

                <tr>
                  <td style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#475569;">Ringen / Eyelets incl. BTW</td>
                  <td align="right" style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;font-weight:700;">${formatCurrency(data.eyeletsFee || 0)}</td>
                </tr>

                <tr>
                  <td style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#475569;">Totaal excl. ${vatPercent}% BTW</td>
                  <td align="right" style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;font-weight:700;">${formatCurrency(data.priceExcludingVat)}</td>
                </tr>

                <tr>
                  <td style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#475569;">BTW ${vatPercent}% inbegrepen</td>
                  <td align="right" style="padding: 13px 18px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;font-weight:700;">${formatCurrency(data.vatAmount)}</td>
                </tr>

                <tr>
                  <td style="padding: 16px 18px;background:#1d4ed8;font-size:14px;color:#bfdbfe;font-weight:700;">Totaal incl. BTW</td>
                  <td align="right" style="padding: 16px 18px;background:#1d4ed8;font-size:18px;color:#ffffff;font-weight:800;">${formatCurrency(data.total)}</td>
                </tr>
              </table>

              <p style="
                margin: 0 0 30px;
                font-size: 12px;
                line-height: 1.7;
                color: #64748b;
              ">
                Alle bedragen zijn inclusief ${vatPercent}% BTW. De BTW is berekend over het spandoek, levering/afhalen en ringen/eyelets.
              </p>

              <!-- Address -->
              <p style="
                margin: 0 0 14px;
                font-size: 16px;
                line-height: 1.4;
                color: #0f172a;
                font-weight: 700;
              ">
                Bezorgadres
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-left: 4px solid #3b82f6;
                border-radius: 12px;
                margin-bottom: 24px;
              ">
                <tr>
                  <td style="
                    padding: 18px 20px;
                    font-size: 14px;
                    line-height: 1.8;
                    color: #334155;
                  ">
                    ${deliveryAddress}
                  </td>
                </tr>
              </table>

              <!-- Invoice Notice -->
              ${
                data.invoiceUrl || data.invoiceFilePath
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 12px;
                margin-bottom: 24px;
              ">
                <tr>
                  <td style="padding: 18px 20px;">
                    <p style="
                      margin: 0 0 4px;
                      font-size: 14.5px;
                      line-height: 1.5;
                      color: #1e40af;
                      font-weight: 700;
                    ">
                      Uw factuur is beschikbaar
                    </p>

                    <p style="
                      margin: 0;
                      font-size: 13px;
                      line-height: 1.7;
                      color: #2563eb;
                    ">
                      Uw PDF-factuur is als bijlage toegevoegd aan deze e-mail.
                    </p>
                  </td>
                </tr>
              </table>
                  `
                  : ""
              }

              <!-- Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 12px;
              ">
                <tr>
                  <td style="
                    padding: 16px 18px;
                    font-size: 13.5px;
                    line-height: 1.7;
                    color: #166534;
                  ">
                    U ontvangt opnieuw bericht zodra uw bestelling verder wordt verwerkt of klaar is voor levering/afhalen.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="
              background: #0f172a;
              padding: 28px 24px;
            ">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="
                    background: rgba(255,255,255,0.08);
                    border-radius: 8px;
                    padding: 8px 14px;
                  ">
                    <img
                      src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
                      alt="Spandoek Print"
                      width="120"
                      style="
                        display: block;
                        width: 120px;
                        height: auto;
                        opacity: 0.9;
                      "
                    />
                  </td>
                </tr>
              </table>

              <p style="
                margin: 18px 0 10px;
                font-size: 12px;
                line-height: 1.7;
              ">
                <a href="#" style="color:#60a5fa;text-decoration:none;margin:0 8px;">Klantenservice</a>
                <a href="#" style="color:#60a5fa;text-decoration:none;margin:0 8px;">Privacybeleid</a>
                <a href="#" style="color:#60a5fa;text-decoration:none;margin:0 8px;">Algemene voorwaarden</a>
              </p>

              <p style="
                margin: 0;
                font-size: 11.5px;
                line-height: 1.8;
                color: #64748b;
              ">
                Hulp nodig? Neem contact op met onze klantenservice.<br/>
                © ${new Date().getFullYear()} Spandoek Print. Alle rechten voorbehouden.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;

  await sendEmail(
    data.email,
    subject,
    html,
    undefined,
    data.invoiceFilePath
      ? [
          {
            filename: `${data.invoiceNumber || "invoice"}.pdf`,
            path: data.invoiceFilePath,
            contentType: "application/pdf",
          },
        ]
      : [],
  );
};