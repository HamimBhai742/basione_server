import sendEmail from "./nodemailerTransport";

interface PaymentSuccessData {
 userName: string;
 email: string;
 amount: number;
 transactionId: string;
 orderId: string;
 date: string;
 invoiceUrl?: string | null;
 invoiceNumber?: string | null;
 invoiceFilePath?: string | null;
}

export const paymentSuccessTemplate = async (data: PaymentSuccessData) => {
 const {
 userName,
 email,
 amount,
 transactionId,
 orderId,
 date,
 invoiceUrl,
 invoiceNumber,
 invoiceFilePath,
 } = data;

 const subject = "Betaling bevestigd - Uw bestelling is onderweg!";

 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <title>Betaling geslaagd</title>

 <style>
 @media only screen and (max-width: 640px) {
 .email-wrapper {
 padding: 20px 10px !important;
 }

 .email-container {
 width: 100% !important;
 border-radius: 12px !important;
 }

 .header-section {
 padding: 28px 20px 26px !important;
 }

 .content-section {
 padding: 28px 18px 0 !important;
 }

 .footer-section {
 padding: 24px 18px !important;
 }

 .main-logo {
 width: 170px !important;
 }

 .footer-logo {
 width: 135px !important;
 }

 .success-icon {
 width: 58px !important;
 height: 58px !important;
 line-height: 58px !important;
 font-size: 28px !important;
 }

 .main-title {
 font-size: 22px !important;
 }

 .amount-text {
 font-size: 30px !important;
 }

 .table-label,
 .table-value {
 display: block !important;
 width: 100% !important;
 box-sizing: border-box !important;
 }

 .table-label {
 padding-bottom: 6px !important;
 border-bottom: none !important;
 }

 .table-value {
 padding-top: 0 !important;
 }

 .dashboard-button {
 display: block !important;
 width: 100% !important;
 box-sizing: border-box !important;
 text-align: center !important;
 }
 }
 </style>
</head>

<body style="
 margin: 0;
 padding: 0;
 background-color: #eef2f7;
 font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
 -webkit-font-smoothing: antialiased;
">
 <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-wrapper" style="
 background-color: #eef2f7;
 padding: 40px 16px;
 ">
 <tr>
 <td align="center">
 <table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="
 max-width: 600px;
 width: 100%;
 background: #ffffff;
 border-radius: 16px;
 overflow: hidden;
 box-shadow: 0 4px 24px rgba(0,0,0,0.08);
 ">
 <tr>
 <td class="header-section" style="
 background: linear-gradient(135deg, #14213d 0%, #1d4ed8 100%);
 padding: 34px 34px 30px;
 text-align: center;
 ">
 <img
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
 width="220"
 alt="Spandoek Print"
 class="main-logo"
 style="
 display: block;
 margin: 0 auto 22px;
 border-radius: 8px;
 background: #ffffff;
 padding: 10px 18px;
 max-width: 220px;
 width: 220px;
 height: auto;
 "
 />

 <div class="success-icon" style="
 display: inline-block;
 background: rgba(255,255,255,0.15);
 border: 3px solid rgba(255,255,255,0.35);
 border-radius: 50%;
 width: 68px;
 height: 68px;
 line-height: 68px;
 text-align: center;
 font-size: 32px;
 margin-bottom: 18px;
 "></div>

 <h1 class="main-title" style="
 margin: 0 0 10px;
 color: #ffffff;
 font-size: 25px;
 line-height: 1.25;
 font-weight: 700;
 letter-spacing: -0.3px;
 ">Betaling geslaagd!</h1>

 <p style="
 margin: 0 auto;
 color: rgba(255,255,255,0.86);
 font-size: 15px;
 line-height: 1.6;
 max-width: 430px;
 ">Uw bestelling is bevestigd en wordt nu verwerkt.</p>
 </td>
 </tr>

 <tr>
 <td class="content-section" style="padding: 34px 38px 0;">
 <p style="
 margin: 0 0 10px;
 font-size: 16px;
 color: #111827;
 font-weight: 700;
 ">Hallo, ${userName} </p>

 <p style="
 margin: 0 0 26px;
 font-size: 15px;
 color: #4b5563;
 line-height: 1.7;
 ">
 Bedankt voor uw aankoop bij <strong style="color:#1d4ed8;">Spandoek Print</strong>.
 Uw betaling is ontvangen en succesvol verwerkt. Hieronder vindt u een overzicht van uw transactie voor uw administratie.
 </p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #eff6ff;
 border-radius: 12px;
 margin-bottom: 28px;
 border: 1px solid #bfdbfe;
 ">
 <tr>
 <td style="padding: 24px 18px; text-align: center;">
 <p style="
 margin: 0 0 8px;
 font-size: 12px;
 color: #64748b;
 text-transform: uppercase;
 letter-spacing: 1px;
 font-weight: 700;
 ">Betaald bedrag</p>

 <p class="amount-text" style="
 margin: 0;
 font-size: 36px;
 line-height: 1.1;
 font-weight: 800;
 color: #1d4ed8;
 letter-spacing: -1px;
 ">EUR ${Number(amount || 0).toFixed(2)}</p>
 </td>
 </tr>
 </table>

 <p style="
 margin: 0 0 14px;
 font-size: 13px;
 color: #64748b;
 text-transform: uppercase;
 letter-spacing: 1px;
 font-weight: 800;
 ">Transactiegegevens</p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 border-collapse: separate;
 border-spacing: 0;
 border-radius: 12px;
 overflow: hidden;
 border: 1px solid #e5e7eb;
 margin-bottom: 24px;
 ">
 <tr>
 <td class="table-label" style="
 padding: 15px 18px;
 background: #f9fafb;
 border-bottom: 1px solid #e5e7eb;
 font-size: 13px;
 color: #64748b;
 font-weight: 700;
 width: 40%;
 vertical-align: top;
 "> Order-ID</td>

 <td class="table-value" style="
 padding: 15px 18px;
 background: #f9fafb;
 border-bottom: 1px solid #e5e7eb;
 font-size: 13px;
 color: #111827;
 font-weight: 600;
 font-family: 'Courier New', monospace;
 word-break: break-word;
 vertical-align: top;
 ">${orderId}</td>
 </tr>

 <tr>
 <td class="table-label" style="
 padding: 15px 18px;
 background: #ffffff;
 border-bottom: 1px solid #e5e7eb;
 font-size: 13px;
 color: #64748b;
 font-weight: 700;
 width: 40%;
 vertical-align: top;
 "> Transactie-ID</td>

 <td class="table-value" style="
 padding: 15px 18px;
 background: #ffffff;
 border-bottom: 1px solid #e5e7eb;
 font-size: 13px;
 color: #111827;
 font-weight: 600;
 font-family: 'Courier New', monospace;
 word-break: break-word;
 vertical-align: top;
 ">${transactionId}</td>
 </tr>

 ${
 invoiceNumber
 ? `
 <tr>
 <td class="table-label" style="
 padding: 15px 18px;
 background: #f9fafb;
 border-bottom: 1px solid #e5e7eb;
 font-size: 13px;
 color: #64748b;
 font-weight: 700;
 width: 40%;
 vertical-align: top;
 "> Factuurnummer</td>

 <td class="table-value" style="
 padding: 15px 18px;
 background: #f9fafb;
 border-bottom: 1px solid #e5e7eb;
 font-size: 13px;
 color: #111827;
 font-weight: 600;
 font-family: 'Courier New', monospace;
 word-break: break-word;
 vertical-align: top;
 ">${invoiceNumber}</td>
 </tr>
 `
 : ""
 }

 <tr>
 <td class="table-label" style="
 padding: 15px 18px;
 background: #ffffff;
 font-size: 13px;
 color: #64748b;
 font-weight: 700;
 width: 40%;
 vertical-align: top;
 "> Datum en tijd</td>

 <td class="table-value" style="
 padding: 15px 18px;
 background: #ffffff;
 font-size: 13px;
 color: #111827;
 font-weight: 600;
 word-break: break-word;
 vertical-align: top;
 ">${date}</td>
 </tr>
 </table>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
 <tr>
 <td>
 <span style="
 display: inline-block;
 background: #dcfce7;
 border: 1px solid #86efac;
 border-radius: 999px;
 padding: 8px 16px;
 font-size: 13px;
 color: #166534;
 font-weight: 800;
 "> Betaalstatus: betaald</span>
 </td>
 </tr>
 </table>

 ${
 invoiceUrl || invoiceFilePath
 ? `
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #eff6ff;
 border: 1px solid #bfdbfe;
 border-radius: 12px;
 margin-bottom: 28px;
 ">
 <tr>
 <td style="padding: 18px 20px;">
 <p style="
 margin: 0;
 font-size: 14px;
 color: #1e3a8a;
 line-height: 1.7;
 ">
 <strong>Uw factuur is klaar.</strong><br/>
 We hebben uw PDF-factuur als bijlage aan deze e-mail toegevoegd voor uw administratie.
 </p>
 </td>
 </tr>
 </table>
 `
 : ""
 }

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
 <tr>
 <td align="center">
 <a
 href="https://spandoekprint.nl/profile/${data.orderId}"
 class="dashboard-button"
 style="
 display: inline-block;
 background: linear-gradient(135deg, #1d4ed8, #2563eb);
 color: #ffffff;
 text-decoration: none;
 font-size: 15px;
 font-weight: 800;
 padding: 14px 34px;
 border-radius: 10px;
 letter-spacing: 0.2px;
 box-shadow: 0 4px 14px rgba(37,99,235,0.28);
 "
 >
 Bekijk uw bestelling 
 </a>
 </td>
 </tr>
 </table>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #fffbeb;
 border: 1px solid #fde68a;
 border-radius: 12px;
 margin-bottom: 34px;
 ">
 <tr>
 <td style="padding: 18px 20px;">
 <p style="
 margin: 0;
 font-size: 13.5px;
 color: #78350f;
 line-height: 1.7;
 ">
 <strong>Hulp nodig?</strong> Als u vragen hebt over uw bestelling of betaling,
 staat onze klantenservice voor u klaar.
 Beantwoord deze e-mail of bezoek ons
 <a href="https://spandoekprint.nl" style="
 color: #1d4ed8;
 font-weight: 700;
 text-decoration: none;
 ">Klantenservice</a>.
 </p>
 </td>
 </tr>
 </table>
 </td>
 </tr>

 <tr>
 <td class="footer-section" style="
 background: #111827;
 border-top: 1px solid #1f2937;
 padding: 28px 38px;
 text-align: center;
 ">
 <img
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
 width="150"
 alt="Spandoek Print"
 class="footer-logo"
 style="
 display: block;
 margin: 0 auto 16px;
 max-width: 150px;
 background: #ffffff;
 padding: 8px 14px;
 border-radius: 8px;
 width: 150px;
 height: auto;
 opacity: 0.9;
 "
 />

 <p style="
 margin: 0 0 8px;
 font-size: 13px;
 font-weight: 800;
 color: #ffffff;
 ">Spandoek Print</p>

 <p style="
 margin: 0 0 14px;
 font-size: 12px;
 color: #cbd5e1;
 line-height: 1.7;
 ">
 123 Print Avenue, Amsterdam, Netherlands<br/>
 <a href="mailto:support@spandoekprint.com" style="
 color: #cbd5e1;
 text-decoration: none;
 ">support@spandoekprint.com</a>
 </p>

 <p style="
 margin: 0;
 font-size: 11.5px;
 color: #94a3b8;
 line-height: 1.7;
 ">
 Deze e-mail is verzonden naar <strong>${email}</strong> omdat u een aankoop hebt gedaan bij Spandoek Print.<br/>
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
