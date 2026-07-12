import sendEmail from "./nodemailerTransport";

export const orderShippedTemplate = async (
 userName: string,
 email: string,
 subject: string,
 data: {
 orderNumber: string;
 shippedDate: string;
 estimatedDelivery: string;
 courierName: string;
 trackingNumber: string;
 trackingLink?: string;
 items: {
 name: string;
 quantity: number;
 price: number;
 image?: string;
 }[];
 totalAmount: number;
 deliveryAddress: string;
 supportLink?: string;
 },
) => {
 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bestelling verzonden</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:40px 40px 32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">🚚</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Uw bestelling is onderweg!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Uw pakket is overgedragen aan de koerier</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <p style="margin:0 0 24px;font-size:15px;color:#374151;">Hallo <strong style="color:#111827;">${userName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
              Goed nieuws! Uw bestelling is overgedragen aan <strong>${data.courierName}</strong> en is nu onderweg. Gebruik de trackinggegevens hieronder om uw pakket te volgen.
            </p>

            <!-- Order Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Besteloverzicht</p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;width:50%;">Bestelnummer</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">#${data.orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;border-top:1px solid #f1f5f9;">Verzenddatum</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #f1f5f9;">${data.shippedDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;border-top:1px solid #f1f5f9;">Koerier</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #f1f5f9;">${data.courierName}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;border-top:1px solid #f1f5f9;">Verwachte levering</td>
                      <td style="padding:6px 0;font-size:14px;color:#1a73e8;font-weight:700;text-align:right;border-top:1px solid #f1f5f9;">${data.estimatedDelivery}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Tracking Card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1d4ed8;letter-spacing:1px;text-transform:uppercase;">Trackingnummer</p>
                  <p style="margin:0 0 12px;font-size:28px;font-weight:800;color:#1a73e8;letter-spacing:4px;">${data.trackingNumber || "—"}</p>
                  <p style="margin:0 0 16px;font-size:13px;color:#3b82f6;">Koerier: <strong>${data.courierName}</strong> &nbsp;|&nbsp; Verwacht: <strong>${data.estimatedDelivery}</strong></p>
                  ${data.trackingLink ? `<a href="${data.trackingLink}" style="display:inline-block;background:#1a73e8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">Volg mijn pakket →</a>` : ""}
                </td>
              </tr>
            </table>

            <!-- Progress Steps -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:4px 0 12px;font-size:12px;font-weight:700;color:#374151;letter-spacing:0.5px;">BEZORGVOORTGANG</td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="25%" align="center" style="vertical-align:top;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#1a73e8;margin:0 auto 6px;line-height:32px;text-align:center;font-size:14px;color:#fff;">✓</div>
                        <p style="margin:0;font-size:11px;color:#6b7280;text-align:center;">Bestelling<br/>geplaatst</p>
                      </td>
                      <td width="25%" align="center" style="vertical-align:top;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#1a73e8;margin:0 auto 6px;line-height:32px;text-align:center;font-size:14px;color:#fff;">✓</div>
                        <p style="margin:0;font-size:11px;color:#6b7280;text-align:center;">Ingepakt</p>
                      </td>
                      <td width="25%" align="center" style="vertical-align:top;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#1a73e8;box-shadow:0 0 0 4px #bfdbfe;margin:0 auto 6px;line-height:32px;text-align:center;font-size:14px;color:#fff;">🚚</div>
                        <p style="margin:0;font-size:11px;color:#1a73e8;font-weight:700;text-align:center;">Onderweg</p>
                      </td>
                      <td width="25%" align="center" style="vertical-align:top;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#e5e7eb;margin:0 auto 6px;line-height:32px;text-align:center;font-size:14px;color:#9ca3af;">📦</div>
                        <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">Geleverd</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>

            <!-- Items -->
            <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#111827;">Verzonden items</p>

            ${data.items.map((item) => `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
              <tr>
                <td width="72" style="vertical-align:top;padding-right:16px;">
                  <img src="${item.image || ''}" alt="${item.name || 'Product'}" width="72" height="72" style="border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;display:block;" />
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">${item.name || 'Product'}</p>
                  <p style="margin:0 0 2px;font-size:13px;color:#6b7280;">Aantal: ${item.quantity}</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;">Prijs: €${item.price}</p>
                </td>
              </tr>
            </table>
            `).join("")}

            <!-- Total -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-top:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 20px;font-size:15px;color:#374151;font-weight:600;">Besteltotaal</td>
                <td style="padding:14px 20px;font-size:15px;color:#111827;font-weight:800;text-align:right;">€${data.totalAmount}</td>
              </tr>
            </table>

            <!-- Delivery Address -->
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>
            <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111827;">Bezorgadres</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 20px;font-size:14px;color:#374151;line-height:1.6;">${data.deliveryAddress}</td>
              </tr>
            </table>

            <!-- Notice -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.6;">
                  <strong>Let op:</strong> Bezorgtijden kunnen variëren door weekenden, feestdagen of drukte bij de koerier. Neem contact op als uw pakket niet aankomt op <strong>${data.estimatedDelivery}</strong>.
                </td>
              </tr>
            </table>

            ${data.supportLink ? `
            <p style="margin:0 0 6px;font-size:14px;color:#6b7280;">Vragen over uw zending?</p>
            <a href="${data.supportLink}" style="color:#1a73e8;font-weight:600;font-size:14px;text-decoration:none;">Neem contact op met onze klantenservice →</a>
            ` : ""}

            <p style="margin:28px 0 0;font-size:14px;color:#374151;line-height:1.7;">
              Bedankt voor uw aankoop bij <strong>Spandoek Print</strong>. We hopen dat u blij bent met uw bestelling!
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">Spandoek Print</p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">Hulp nodig? Neem contact op met onze klantenservice.<br/>© ${new Date().getFullYear()} Spandoek Print. Alle rechten voorbehouden.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
`;

 await sendEmail(email, subject, html);
};
