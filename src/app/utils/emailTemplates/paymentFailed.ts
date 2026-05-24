import sendEmail from "./nodemailerTransport";

interface PaymentFailedData {
 userName: string;
 email: string;
 amount: number;
 transactionId: string;
 orderId: string;
 date: string;
 failureReason?: string;
 sessionUrl?: string;
}

export const paymentFailedTemplate = async (data: PaymentFailedData) => {
 const {
 userName,
 email,
 amount,
 transactionId,
 orderId,
 date,
 failureReason,
 sessionUrl,
 } = data;

 const subject = "Betaling mislukt - Actie vereist";

 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <title>Betaling mislukt</title>
</head>

<body style="
 margin: 0;
 padding: 0;
 background-color: #f4f1f0;
 font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
 -webkit-font-smoothing: antialiased;
">

 <!-- Outer wrapper -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f1f0; padding: 40px 16px;">
 <tr>
 <td align="center">

 <!-- Card -->
 <table width="600" cellpadding="0" cellspacing="0" border="0" style="
 max-width: 600px;
 width: 100%;
 background: #ffffff;
 border-radius: 16px;
 overflow: hidden;
 box-shadow: 0 4px 24px rgba(0,0,0,0.08);
 ">

 <!-- ===== HEADER BANNER ===== -->
 <tr>
 <td style="
 background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 60%, #ef4444 100%);
 padding: 40px 40px 32px;
 text-align: center;
 ">
 <!-- Logo -->
 <img
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
 width="300"
 alt="Spandoek Print"
 style="display:block; margin: 0 auto 24px; border-radius: 8px; background:#ffffff; padding:10px 18px;"
 />

 <!-- Failed icon circle -->
 <div style="
 display: inline-block;
 background: rgba(255,255,255,0.15);
 border: 3px solid rgba(255,255,255,0.4);
 border-radius: 50%;
 width: 72px;
 height: 72px;
 line-height: 72px;
 text-align: center;
 font-size: 34px;
 margin-bottom: 20px;
 "></div>

 <h1 style="
 margin: 0 0 8px;
 color: #ffffff;
 font-size: 26px;
 font-weight: 700;
 letter-spacing: -0.3px;
 ">Betaling mislukt</h1>

 <p style="
 margin: 0;
 color: rgba(255,255,255,0.82);
 font-size: 15px;
 ">Helaas konden we uw betaling niet verwerken.</p>
 </td>
 </tr>

 <!-- ===== BODY CONTENT ===== -->
 <tr>
 <td style="padding: 36px 40px 0;">

 <!-- Greeting -->
 <p style="
 margin: 0 0 8px;
 font-size: 16px;
 color: #1a1a2e;
 font-weight: 600;
 ">Hallo, ${userName} </p>

 <p style="
 margin: 0 0 28px;
 font-size: 15px;
 color: #555e7a;
 line-height: 1.7;
 ">
 Het spijt ons u te moeten informeren dat uw recente betaling van
 <strong style="color:#b91c1c;">EUR ${amount.toFixed(2)}</strong>
 to <strong style="color:#1a3faa;">Spandoek Print</strong> niet kon worden voltooid.
 Controleer de gegevens hieronder en probeer het opnieuw.
 </p>

 <!-- ===== AMOUNT HIGHLIGHT ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
 border-radius: 12px;
 margin-bottom: 28px;
 border: 1px solid #fecaca;
 ">
 <tr>
 <td style="padding: 22px; text-align: center;">
 <p style="margin: 0 0 4px; font-size: 13px; color: #9b5555; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Openstaand bedrag</p>
 <p style="margin: 0; font-size: 38px; font-weight: 800; color: #b91c1c; letter-spacing: -1px;">EUR ${amount.toFixed(2)}</p>
 </td>
 </tr>
 </table>

 <!-- ===== FAILURE REASON BOX ===== -->
 ${
 failureReason
 ? `
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #fff8f0;
 border: 1px solid #fbd38d;
 border-left: 4px solid #f59e0b;
 border-radius: 10px;
 margin-bottom: 28px;
 ">
 <tr>
 <td style="padding: 14px 18px;">
 <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.8px;">Reden van mislukking</p>
 <p style="margin: 0; font-size: 14px; color: #78350f;">${failureReason}</p>
 </td>
 </tr>
 </table>
 `
 : ""
 }

 <!-- ===== ORDER DETAILS TABLE ===== -->
 <p style="
 margin: 0 0 12px;
 font-size: 13px;
 color: #6b7a9f;
 text-transform: uppercase;
 letter-spacing: 1px;
 font-weight: 700;
 ">Transactiegegevens</p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 border-collapse: collapse;
 border-radius: 10px;
 overflow: hidden;
 border: 1px solid #e8ecf5;
 margin-bottom: 28px;
 ">
 <!-- Row 1 -->
 <tr>
 <td style="
 padding: 14px 18px;
 background: #f8f9fc;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #6b7a9f;
 font-weight: 600;
 width: 40%;
 "> Order-ID</td>
 <td style="
 padding: 14px 18px;
 background: #f8f9fc;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #1a1a2e;
 font-weight: 500;
 font-family: 'Courier New', monospace;
 ">${orderId}</td>
 </tr>
 <!-- Row 2 -->
 <tr>
 <td style="
 padding: 14px 18px;
 background: #ffffff;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #6b7a9f;
 font-weight: 600;
 "> Transactie-ID</td>
 <td style="
 padding: 14px 18px;
 background: #ffffff;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #1a1a2e;
 font-weight: 500;
 font-family: 'Courier New', monospace;
 ">${transactionId}</td>
 </tr>
 <!-- Row 3 -->
 <tr>
 <td style="
 padding: 14px 18px;
 background: #f8f9fc;
 font-size: 13px;
 color: #6b7a9f;
 font-weight: 600;
 "> Datum en tijd</td>
 <td style="
 padding: 14px 18px;
 background: #f8f9fc;
 font-size: 13px;
 color: #1a1a2e;
 font-weight: 500;
 ">${date}</td>
 </tr>
 </table>

 <!-- ===== STATUS BADGE ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
 <tr>
 <td>
 <table cellpadding="0" cellspacing="0" border="0">
 <tr>
 <td style="
 background: #fee2e2;
 border: 1px solid #fca5a5;
 border-radius: 99px;
 padding: 6px 16px;
 ">
 <span style="font-size: 13px; color: #991b1b; font-weight: 700;"> Betaalstatus: mislukt</span>
 </td>
 </tr>
 </table>
 </td>
 </tr>
 </table>

 <!-- ===== WHAT TO DO NEXT ===== -->
 <p style="
 margin: 0 0 12px;
 font-size: 13px;
 color: #6b7a9f;
 text-transform: uppercase;
 letter-spacing: 1px;
 font-weight: 700;
 ">Wat u kunt doen</p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #f8f9fc;
 border: 1px solid #e8ecf5;
 border-radius: 10px;
 margin-bottom: 32px;
 ">
 <tr>
 <td style="padding: 18px 20px;">
 <!-- Step 1 -->
 <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px; width: 100%;">
 <tr>
 <td style="width: 28px; vertical-align: top;">
 <div style="
 width: 22px;
 height: 22px;
 background: #1a3faa;
 border-radius: 50%;
 color: #fff;
 font-size: 11px;
 font-weight: 700;
 text-align: center;
 line-height: 22px;
 ">1</div>
 </td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5; vertical-align: top;">
 <strong>Controleer uw betaalgegevens</strong> Controleer of uw kaartnummer, vervaldatum en CVV correct zijn ingevuld.
 </td>
 </tr>
 </table>
 <!-- Step 2 -->
 <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px; width: 100%;">
 <tr>
 <td style="width: 28px; vertical-align: top;">
 <div style="
 width: 22px;
 height: 22px;
 background: #1a3faa;
 border-radius: 50%;
 color: #fff;
 font-size: 11px;
 font-weight: 700;
 text-align: center;
 line-height: 22px;
 ">2</div>
 </td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5; vertical-align: top;">
 <strong>Zorg voor voldoende saldo</strong> Controleer of uw account voldoende saldo heeft om deze transactie te voltooien.
 </td>
 </tr>
 </table>
 <!-- Step 3 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
 <tr>
 <td style="width: 28px; vertical-align: top;">
 <div style="
 width: 22px;
 height: 22px;
 background: #1a3faa;
 border-radius: 50%;
 color: #fff;
 font-size: 11px;
 font-weight: 700;
 text-align: center;
 line-height: 22px;
 ">3</div>
 </td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5; vertical-align: top;">
 <strong>Probeer een andere betaalmethode</strong> Gebruik een andere kaart of een alternatieve betaaloptie.
 </td>
 </tr>
 </table>
 </td>
 </tr>
 </table>

 <!-- ===== CTA BUTTON ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
 <tr>
 <td align="center">
 <a
 href=${sessionUrl}
 style="
 display: inline-block;
 background: linear-gradient(135deg, #b91c1c, #ef4444);
 color: #ffffff;
 text-decoration: none;
 font-size: 15px;
 font-weight: 700;
 padding: 14px 36px;
 border-radius: 10px;
 letter-spacing: 0.3px;
 box-shadow: 0 4px 14px rgba(185,28,28,0.35);
 "
 >
 Probeer opnieuw te betalen 
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
 <strong>Nog steeds problemen?</strong> Onze klantenservice staat klaar om u snel te helpen.
 Beantwoord deze e-mail of bezoek ons
 <a href="https://your-frontend-url.com/support" style="color: #1a3faa; font-weight: 600;">Helpcenter</a>.
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
 Deze e-mail is verzonden naar <strong>${email}</strong> omdat er een betaalpoging is gedaan op uw account.<br/>
 ${new Date().getFullYear()} Spandoek Print. Alle rechten voorbehouden.
 </p>
 </td>
 </tr>

 </table>
 <!-- End card -->

 </td>
 </tr>
 </table>

</body>
</html>
 `;

 await sendEmail(email, subject, html);
};
