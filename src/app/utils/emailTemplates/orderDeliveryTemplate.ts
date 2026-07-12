import sendEmail from "./nodemailerTransport";

export const orderDeliveryCompleteTemplate = async (
 userName: string,
 email: string,
 subject: string,
 data: {
 orderNumber: string;
 deliveredDate: string;
 items: {
 name: string;
 quantity: number;
 price: number;
 image?: string;
 }[];
 totalAmount: number;
 deliveryAddress: string;
 reviewLink?: string;
 },
) => {
 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bestelling geleverd</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:40px 40px 32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">✅</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Bestelling succesvol geleverd!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.88);font-size:14px;">Uw pakket is veilig aangekomen</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <p style="margin:0 0 24px;font-size:15px;color:#374151;">Hallo <strong style="color:#111827;">${userName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
              We laten u graag weten dat uw bestelling succesvol is afgeleverd op uw adres. We hopen dat u helemaal tevreden bent met uw aankoop!
            </p>

            <!-- Delivery Confirmation Card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#15803d;letter-spacing:1px;text-transform:uppercase;">Leveringsbevestiging</p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#374151;width:50%;">Bestelnummer</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">#${data.orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#374151;border-top:1px solid #dcfce7;">Geleverd op</td>
                      <td style="padding:6px 0;font-size:14px;color:#16a34a;font-weight:700;text-align:right;border-top:1px solid #dcfce7;">${data.deliveredDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#374151;border-top:1px solid #dcfce7;">Bezorgadres</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #dcfce7;">${data.deliveryAddress}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Progress Steps — All Done -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:4px 0 12px;font-size:12px;font-weight:700;color:#374151;letter-spacing:0.5px;">BEZORGVOORTGANG</td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="25%" align="center" style="vertical-align:top;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#16a34a;margin:0 auto 6px;line-height:32px;text-align:center;font-size:14px;color:#fff;">✓</div>
                        <p style="margin:0;font-size:11px;color:#6b7280;text-align:center;">Bestelling<br/>geplaatst</p>
                      </td>
                      <td width="25%" align="center" style="vertical-align:top;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#16a34a;margin:0 auto 6px;line-height:32px;text-align:center;font-size:14px;color:#fff;">✓</div>
                        <p style="margin:0;font-size:11px;color:#6b7280;text-align:center;">Ingepakt</p>
                      </td>
                      <td width="25%" align="center" style="vertical-align:top;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#16a34a;margin:0 auto 6px;line-height:32px;text-align:center;font-size:14px;color:#fff;">✓</div>
                        <p style="margin:0;font-size:11px;color:#6b7280;text-align:center;">Onderweg</p>
                      </td>
                      <td width="25%" align="center" style="vertical-align:top;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 4px #bbf7d0;margin:0 auto 6px;line-height:32px;text-align:center;font-size:14px;color:#fff;">✓</div>
                        <p style="margin:0;font-size:11px;color:#16a34a;font-weight:700;text-align:center;">Geleverd!</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>

            <!-- Items -->
            <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#111827;">Geleverde items</p>

            ${data.items.map((item) => `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
              <tr>
                <td width="72" style="vertical-align:top;padding-right:16px;">
                  <img src="${item.image || ''}" alt="${item.name || 'Banner'}" width="72" height="72" style="border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;display:block;" />
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">${item.name || 'Banner'}</p>
                  <p style="margin:0 0 2px;font-size:13px;color:#6b7280;">Aantal: ${item.quantity}</p>
                  <p style="margin:0;font-size:13px;color:#6b7280;">Prijs: €${item.price}</p>
                </td>
              </tr>
            </table>
            `).join("")}

            <!-- Total -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-top:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:14px 20px;font-size:15px;color:#374151;font-weight:600;">Besteltotaal</td>
                <td style="padding:14px 20px;font-size:15px;color:#111827;font-weight:800;text-align:right;">€${data.totalAmount}</td>
              </tr>
            </table>

            ${data.reviewLink ? `
            <!-- Review CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);border:1px solid #fed7aa;border-radius:12px;margin-bottom:24px;text-align:center;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 6px;font-size:22px;">⭐</p>
                  <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111827;">Tevreden met uw bestelling?</p>
                  <p style="margin:0 0 18px;font-size:14px;color:#6b7280;">Uw mening helpt andere klanten! Laat een review achter en deel uw ervaring.</p>
                  <a href="${data.reviewLink}" style="display:inline-block;background:#f57224;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">Schrijf een review →</a>
                </td>
              </tr>
            </table>
            ` : ""}

            <!-- Support Note -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;font-size:14px;color:#374151;line-height:1.7;">
                  Problemen met uw bestelling of vragen? Neem gerust contact op — we helpen u graag!
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
              Bedankt voor uw aankoop bij <strong>Spandoek Print</strong>. We hopen dat u nog lang plezier heeft van uw bestelling!
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
