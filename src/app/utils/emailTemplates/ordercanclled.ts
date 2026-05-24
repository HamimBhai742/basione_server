import config from "../../../config";
import sendEmail from "./nodemailerTransport";

export interface OrderCancelledData {
 userName: string;
 email: string;
 orderId: string;
 orderDate: string;
 cancelledDate: string;
 items: {
 name: string;
 quantity: number;
 price: number;
 }[];
 subtotal: number;
 cancelReason?: string;
 cancelledBy?: "user" | "admin" | "system";
}

export const orderCancelledTemplate = async (data: OrderCancelledData) => {
 const {
 userName,
 email,
 orderId,
 orderDate,
 cancelledDate,
 items,
 subtotal,
 cancelReason,
 cancelledBy = "user",
 } = data;

 const subject = `Bestelling #${orderId} is geannuleerd`;

 const cancelledByLabel =
 cancelledBy === "admin"
 ? "Geannuleerd door de klantenservice"
 : cancelledBy === "system"
 ? "Automatisch geannuleerd door het systeem"
 : "Door u geannuleerd";

 const itemRows = items
 .map(
 (item, index) => `
 <tr>
 <td style="
 padding: 13px 18px;
 background: ${index % 2 === 0 ? "#f8f9fc" : "#ffffff"};
 border-bottom: 1px solid #e8ecf5;
 font-size: 13.5px;
 color: #374151;
 ">${item.name}</td>
 <td style="
 padding: 13px 18px;
 background: ${index % 2 === 0 ? "#f8f9fc" : "#ffffff"};
 border-bottom: 1px solid #e8ecf5;
 font-size: 13.5px;
 color: #6b7a9f;
 text-align: center;
 ">x${item.quantity}</td>
 <td style="
 padding: 13px 18px;
 background: ${index % 2 === 0 ? "#f8f9fc" : "#ffffff"};
 border-bottom: 1px solid #e8ecf5;
 font-size: 13.5px;
 color: #374151;
 text-align: right;
 text-decoration: line-through;
 opacity: 0.6;
 ">EUR ${(item.price * item.quantity).toFixed(2)}</td>
 </tr>
 `,
 )
 .join("");

 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <title>Bestelling geannuleerd</title>
</head>

<body style="
 margin: 0;
 padding: 0;
 background-color: #efefef;
 font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
 -webkit-font-smoothing: antialiased;
">

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #efefef; padding: 40px 16px;">
 <tr>
 <td align="center">

 <!-- Card -->
 <table width="600" cellpadding="0" cellspacing="0" border="0" style="
 max-width: 600px;
 width: 100%;
 background: #ffffff;
 border-radius: 16px;
 overflow: hidden;
 box-shadow: 0 4px 24px rgba(0,0,0,0.09);
 ">

 <!-- ===== HEADER ===== -->
 <tr>
 <td style="
 background: linear-gradient(135deg, #1e293b 0%, #334155 55%, #475569 100%);
 padding: 40px 40px 32px;
 text-align: center;
 ">
 <img
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
 width="300"
 alt="Spandoek Print"
 style="display:block; margin: 0 auto 24px; border-radius: 8px; background:#ffffff; padding:10px 18px;"
 />

 <div style="
 display: inline-block;
 background: rgba(255,255,255,0.12);
 border: 3px solid rgba(255,255,255,0.35);
 border-radius: 50%;
 width: 72px;
 height: 72px;
 line-height: 72px;
 text-align: center;
 font-size: 32px;
 margin-bottom: 20px;
 "></div>

 <h1 style="
 margin: 0 0 8px;
 color: #ffffff;
 font-size: 26px;
 font-weight: 700;
 letter-spacing: -0.3px;
 ">Bestelling geannuleerd</h1>

 <p style="
 margin: 0 0 16px;
 color: rgba(255,255,255,0.78);
 font-size: 15px;
 ">Uw bestelling is geannuleerd. Het spijt ons dat deze niet doorgaat.</p>

 <!-- Order-ID pill -->
 <div style="
 display: inline-block;
 background: rgba(255,255,255,0.15);
 border: 1px solid rgba(255,255,255,0.3);
 border-radius: 99px;
 padding: 6px 20px;
 font-size: 13px;
 color: rgba(255,255,255,0.9);
 font-weight: 600;
 letter-spacing: 0.5px;
 ">Bestelling #${orderId}</div>
 </td>
 </tr>

 <!-- ===== BODY ===== -->
 <tr>
 <td style="padding: 36px 40px 0;">

 <!-- Greeting -->
 <p style="margin: 0 0 8px; font-size: 16px; color: #1a1a2e; font-weight: 600;">
 Hallo, ${userName} 
 </p>
 <p style="margin: 0 0 28px; font-size: 15px; color: #555e7a; line-height: 1.75;">
 We bevestigen dat uw bestelling <strong style="color:#1e293b;">#${orderId}</strong>, geplaatst op
 <strong style="color:#1e293b;">${orderDate}</strong>, succesvol is geannuleerd op
 <strong style="color:#1e293b;">${cancelledDate}</strong>.
 Voor deze bestelling worden geen kosten in rekening gebracht.
 </p>

 <!-- ===== CANCELLED BY & STATUS ROW ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
 <tr>
 <!-- Status badge -->
 <td style="width: 50%; padding-right: 8px;">
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #f3f4f6;
 border: 1px solid #d1d5db;
 border-radius: 10px;
 text-align: center;
 ">
 <tr>
 <td style="padding: 14px 12px;">
 <p style="margin: 0 0 4px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Bestelstatus</p>
 <p style="margin: 0; font-size: 14px; font-weight: 700; color: #374151;"> Geannuleerd</p>
 </td>
 </tr>
 </table>
 </td>
 <!-- Cancelled by -->
 <td style="width: 50%; padding-left: 8px;">
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #f3f4f6;
 border: 1px solid #d1d5db;
 border-radius: 10px;
 text-align: center;
 ">
 <tr>
 <td style="padding: 14px 12px;">
 <p style="margin: 0 0 4px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Gestart door</p>
 <p style="margin: 0; font-size: 13px; font-weight: 700; color: #374151;">${cancelledByLabel}</p>
 </td>
 </tr>
 </table>
 </td>
 </tr>
 </table>

 <!-- ===== CANCEL REASON ===== -->
 ${
 cancelReason
 ? `
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #fafafa;
 border: 1px solid #d1d5db;
 border-left: 4px solid #94a3b8;
 border-radius: 10px;
 margin-bottom: 28px;
 ">
 <tr>
 <td style="padding: 14px 18px;">
 <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px;">Reden van annulering</p>
 <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${cancelReason}</p>
 </td>
 </tr>
 </table>
 `
 : ""
 }

 <!-- ===== ORDER ITEMS ===== -->
 <p style="
 margin: 0 0 12px;
 font-size: 13px;
 color: #6b7a9f;
 text-transform: uppercase;
 letter-spacing: 1px;
 font-weight: 700;
 ">Geannuleerde items</p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 border-collapse: collapse;
 border-radius: 10px;
 overflow: hidden;
 border: 1px solid #e8ecf5;
 margin-bottom: 0;
 ">
 <!-- Header row -->
 <tr>
 <td style="
 padding: 11px 18px;
 background: #1e293b;
 font-size: 12px;
 color: rgba(255,255,255,0.7);
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.8px;
 ">Item</td>
 <td style="
 padding: 11px 18px;
 background: #1e293b;
 font-size: 12px;
 color: rgba(255,255,255,0.7);
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.8px;
 text-align: center;
 ">Aantal</td>
 <td style="
 padding: 11px 18px;
 background: #1e293b;
 font-size: 12px;
 color: rgba(255,255,255,0.7);
 font-weight: 700;
 text-transform: uppercase;
 letter-spacing: 0.8px;
 text-align: right;
 ">Prijs</td>
 </tr>

 <!-- Item rows -->
 ${itemRows}

 <!-- Subtotal row -->
 <tr>
 <td colspan="2" style="
 padding: 14px 18px;
 background: #f1f5f9;
 border-top: 2px solid #e2e8f0;
 font-size: 14px;
 font-weight: 700;
 color: #374151;
 ">Totaal (vervallen)</td>
 <td style="
 padding: 14px 18px;
 background: #f1f5f9;
 border-top: 2px solid #e2e8f0;
 font-size: 14px;
 font-weight: 700;
 color: #374151;
 text-align: right;
 text-decoration: line-through;
 opacity: 0.55;
 ">EUR ${subtotal.toFixed(2)}</td>
 </tr>
 </table>

 <!-- ===== NO CHARGE NOTICE ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 margin-top: 6px;
 margin-bottom: 28px;
 ">
 <tr>
 <td align="right">
 <span style="
 font-size: 12px;
 color: #16a34a;
 font-weight: 600;
 "> Er zijn geen kosten in rekening gebracht op uw account</span>
 </td>
 </tr>
 </table>

 <!-- ===== REFUND NOTICE ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #f0fdf4;
 border: 1px solid #bbf7d0;
 border-left: 4px solid #22c55e;
 border-radius: 10px;
 margin-bottom: 28px;
 ">
 <tr>
 <td style="padding: 16px 18px;">
 <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.8px;"> Restitutiebeleid</p>
 <p style="margin: 0; font-size: 13.5px; color: #166534; line-height: 1.6;">
 Als de betaling al is verwerkt, wordt het <strong>volledige bedrag teruggestort</strong> via uw oorspronkelijke betaalmethode binnen <strong>5-7 werkdagen</strong>. De verwerkingstijd kan verschillen per bank of kaartuitgever.
 </p>
 </td>
 </tr>
 </table>

 <!-- ===== PLACE NEW ORDER CTA ===== -->
 <p style="
 margin: 0 0 16px;
 font-size: 15px;
 color: #555e7a;
 line-height: 1.7;
 text-align: center;
 ">
 Wilt u een nieuwe bestelling plaatsen? We helpen u graag opnieuw. 
 </p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
 <tr>
 <td align="center">
 <a
 href="${config.client_url}"
 style="
 display: inline-block;
 background: linear-gradient(135deg, #1a3faa, #2d63e2);
 color: #ffffff;
 text-decoration: none;
 font-size: 15px;
 font-weight: 700;
 padding: 14px 36px;
 border-radius: 10px;
 letter-spacing: 0.3px;
 box-shadow: 0 4px 14px rgba(34,92,228,0.28);
 "
 >
 Bekijk producten 
 </a>
 </td>
 </tr>
 </table>

 <!-- ===== DIVIDER ===== -->
 <hr style="border: none; border-top: 1px solid #e8ecf5; margin: 0 0 24px;" />

 <!-- ===== SUPPORT NOTE ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #fffbeb;
 border: 1px solid #fde68a;
 border-radius: 10px;
 margin-bottom: 32px;
 ">
 <tr>
 <td style="padding: 16px 18px;">
 <p style="margin: 0; font-size: 13.5px; color: #78450f; line-height: 1.6;">
 <strong>Heeft u deze annulering niet aangevraagd?</strong> Als u denkt dat dit een vergissing is of hulp nodig hebt,
 neem dan direct contact op met onze klantenservice.
 <a href="${config.client_url}" style="color: #1a3faa; font-weight: 600;">Bezoek het Helpcenter</a>.
 </p>
 </td>
 </tr>
 </table>

 </td>
 </tr>

 <!-- ===== FOOTER ===== -->
 <tr>
 <td style="
 background: #f8f9fc;
 border-top: 1px solid #e8ecf5;
 padding: 28px 40px;
 text-align: center;
 ">
 <img
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
 width="200"
 alt="Spandoek Print"
 style="display:block; margin: 0 auto 12px; opacity: 0.85; background:#ffffff; padding:8px 14px; border-radius:8px;"
 />
 <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #1a3faa;">Spandoek Print</p>
 <p style="margin: 0 0 12px; font-size: 12px; color: #9ca3b8; line-height: 1.6;">
 123 Print Avenue, Amsterdam, Netherlands<br/>
 <a href="mailto:support@spandoekprint.com" style="color: #9ca3b8;">support@spandoekprint.com</a>
 </p>
 <p style="margin: 0; font-size: 11.5px; color: #b0b8cc; line-height: 1.6;">
 Deze e-mail is verzonden naar <strong>${email}</strong> over bestelling #${orderId} op uw Spandoek Print-account.<br/>
 ${new Date().getFullYear()} Spandoek Print. Alle rechten voorbehouden.
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

 await sendEmail(email, subject, html);
};
