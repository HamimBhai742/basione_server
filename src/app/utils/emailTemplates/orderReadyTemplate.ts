import sendEmail from "./nodemailerTransport";

export const orderReadyTemplate = async (
  userName: string,
  email: string,
  subject: string,
  data: {
    orderNumber: string;
    readyDate: string;
    pickupDeadline?: string;
    pickupAddress?: string;
    pickupCode?: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      image?: string;
    }[];
    totalAmount: number;
    paymentMethod: string;
    trackingLink?: string;
    supportLink?: string;
    isPickup?: boolean;
  },
) => {
  const isPickup = data.isPickup !== undefined ? data.isPickup : (!data.trackingLink || data.trackingLink === "");

 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${isPickup ? "Bestelling klaar voor afhalen" : "Bestelling klaar voor levering"}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f57224 0%,#e65c00 100%);padding:40px 40px 32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">${isPickup ? "🏪" : "📦"}</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">${isPickup ? "Uw bestelling is klaar!" : "Klaar voor verzending!"}</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.88);font-size:14px;">${isPickup ? "U kunt uw bestelling komen ophalen" : "Uw bestelling wordt snel verzonden"}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <p style="margin:0 0 24px;font-size:15px;color:#374151;">Hallo <strong style="color:#111827;">${userName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
              ${isPickup
                ? "Geweldig nieuws! Uw bestelling is zorgvuldig ingepakt en staat klaar om af te halen. Bekijk de gegevens hieronder voor uw afhaalafspraak."
                : "Uw bestelling is ingepakt en staat klaar voor verzending. U ontvangt binnenkort een trackinglink zodra uw pakket is overgedragen aan de koerier."
              }
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
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;border-top:1px solid #f1f5f9;">Klaar op</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #f1f5f9;">${data.readyDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;border-top:1px solid #f1f5f9;">Betaalmethode</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #f1f5f9;">${data.paymentMethod}</td>
                    </tr>
                    ${data.pickupAddress ? `
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;border-top:1px solid #f1f5f9;">${isPickup ? "Afhaaladres" : "Adres"}</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #f1f5f9;">${data.pickupAddress}</td>
                    </tr>
                    ` : ""}
                    ${isPickup ? `
                    <tr>
                      <td style="padding:6px 0;font-size:14px;color:#6b7280;border-top:1px solid #f1f5f9;vertical-align:top;">Openingstijden</td>
                      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;border-top:1px solid #f1f5f9;">
                        Maandag t/m donderdag: 08:30 – 17:00<br/>
                        Vrijdag: 08:30 – 12:00<br/>
                        Andere dagen op afspraak
                      </td>
                    </tr>
                    ` : ""}
                  </table>
                </td>
              </tr>
            </table>

            ${isPickup && data.pickupCode ? `
            <!-- Pickup Code Card -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;margin-bottom:24px;text-align:center;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#c2410c;letter-spacing:1.5px;text-transform:uppercase;">Uw afhaalcode</p>
                  <p style="margin:0 0 8px;font-size:36px;font-weight:800;color:#ea580c;letter-spacing:8px;">${data.pickupCode}</p>
                  <p style="margin:0;font-size:13px;color:#9a3412;">Toon deze code aan de balie wanneer u uw bestelling ophaalt.</p>
                </td>
              </tr>
            </table>
            ` : ""}

            ${data.pickupDeadline ? `
            <!-- Deadline Notice -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.6;">
                  ⚠️ <strong>Belangrijk:</strong> Haal uw bestelling op uiterlijk <strong>${data.pickupDeadline}</strong>. Bestellingen die na deze datum niet zijn opgehaald, kunnen automatisch worden geannuleerd.
                </td>
              </tr>
            </table>
            ` : ""}

            <!-- Steps -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:0 0 14px;font-size:14px;font-weight:700;color:#111827;">${isPickup ? "Wat u nu kunt doen" : "Volgende stappen"}</td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align:top;padding-bottom:12px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="vertical-align:top;padding-right:14px;">
                              <div style="width:28px;height:28px;border-radius:50%;background:#f57224;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#fff;">1</div>
                            </td>
                            <td style="vertical-align:middle;font-size:14px;color:#374151;line-height:1.6;">
                              ${isPickup ? "Ga naar onze winkel op de Neonweg 200 in Almere." : "Wacht op uw verzendbevestiging met trackingnummer."}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="vertical-align:top;padding-bottom:12px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="vertical-align:top;padding-right:14px;">
                              <div style="width:28px;height:28px;border-radius:50%;background:#f57224;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#fff;">2</div>
                            </td>
                            <td style="vertical-align:middle;font-size:14px;color:#374151;line-height:1.6;">
                              ${data.pickupCode ? `Toon uw afhaalcode <strong>${data.pickupCode}</strong> aan de balie.` : isPickup ? "Meld u aan de balie en vermeld uw bestelnummer." : "Volg uw pakket via de trackinglink in onze volgende e-mail."}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="vertical-align:top;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="vertical-align:top;padding-right:14px;">
                              <div style="width:28px;height:28px;border-radius:50%;background:#f57224;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#fff;">3</div>
                            </td>
                            <td style="vertical-align:middle;font-size:14px;color:#374151;line-height:1.6;">
                              Controleer uw items bij ontvangst en geniet van uw aankoop!
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>

            <!-- Items -->
            <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#111827;">Items in uw bestelling</p>

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

            ${data.supportLink ? `
            <p style="margin:0 0 6px;font-size:14px;color:#6b7280;">Heeft u vragen?</p>
            <a href="${data.supportLink}" style="color:#f57224;font-weight:600;font-size:14px;text-decoration:none;">Neem contact op met onze klantenservice →</a>
            ` : ""}

            <p style="margin:28px 0 0;font-size:14px;color:#374151;line-height:1.7;">
              Bedankt voor uw aankoop bij <strong>Spandoek Print</strong>. We hopen dat u veel plezier heeft van uw bestelling!
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
