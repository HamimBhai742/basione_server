import sendEmail from "./nodemailerTransport";
import config from "../../../config";

interface ForgotPasswordOTPData {
  userName: string;
  email: string;
  otp: string;
  requestedAt: string;
}

export const forgotPasswordOTPTemplate = async (
  data: ForgotPasswordOTPData,
) => {
  const { userName, email, otp, requestedAt } = data;

  const subject = "Uw OTP-code voor wachtwoordherstel";

  // Split OTP into individual digits for styled boxes
  const otpDigits = otp
    .split("")
    .map(
      (digit) => `
 <td style="padding: 0 5px;">
 <div style="
 width: 48px;
 height: 58px;
 background: #ffffff;
 border: 2px solid #1a3faa;
 border-radius: 10px;
 font-size: 28px;
 font-weight: 800;
 color: #1a3faa;
 text-align: center;
 line-height: 58px;
 letter-spacing: 0;
 box-shadow: 0 2px 8px rgba(26,63,170,0.12);
 ">${digit}</div>
 </td>
 `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <title>OTP voor vergeten wachtwoord</title>
</head>

<body style="
 margin: 0;
 padding: 0;
 background-color: #eef2f7;
 font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
 -webkit-font-smoothing: antialiased;
">

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eef2f7; padding: 40px 16px;">
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

 <!-- ===== HEADER ===== -->
 <tr>
 <td style="
 background: linear-gradient(135deg, #0f2878 0%, #1a3faa 55%, #2d63e2 100%);
 padding: 40px 40px 36px;
 text-align: center;
 ">
 <!-- Logo -->
 <img
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/logo.png"
 width="300"
 alt="Spandoek Print"
 style="display:block; margin: 0 auto 24px; border-radius: 8px; background:#ffffff; padding:10px 18px;"
 />

 <!-- Lock icon circle -->
 <div style="
 display: inline-block;
 background: rgba(255,255,255,0.14);
 border: 3px solid rgba(255,255,255,0.38);
 border-radius: 50%;
 width: 76px;
 height: 76px;
 line-height: 76px;
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
 ">Verzoek om wachtwoord opnieuw in te stellen</h1>

 <p style="
 margin: 0;
 color: rgba(255,255,255,0.78);
 font-size: 15px;
 line-height: 1.6;
 ">
 Gebruik de eenmalige code hieronder om uw wachtwoord opnieuw in te stellen.<br/>
 Deze code is slechts <strong style="color:#ffffff;">5 minuten geldig</strong>.
 </p>
 </td>
 </tr>

 <!-- ===== BODY ===== -->
 <tr>
 <td style="padding: 36px 40px 0;">

 <!-- Greeting -->
 <p style="margin: 0 0 8px; font-size: 16px; color: #1a1a2e; font-weight: 600;">
 Hallo, ${userName} 
 </p>
 <p style="margin: 0 0 32px; font-size: 15px; color: #555e7a; line-height: 1.75;">
 We hebben een verzoek ontvangen om het wachtwoord voor uw
 <strong style="color:#1a3faa;">Spandoek Print</strong> account.
 Voer de 6-cijferige OTP-code hieronder in om door te gaan met het opnieuw instellen van uw wachtwoord.
 </p>

 <!-- ===== OTP BOX ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
 border: 1px solid #c7d7fd;
 border-radius: 14px;
 margin-bottom: 10px;
 ">
 <tr>
 <td style="padding: 30px 20px 24px; text-align: center;">

 <p style="
 margin: 0 0 18px;
 font-size: 12px;
 color: #6b7a9f;
 text-transform: uppercase;
 letter-spacing: 1.5px;
 font-weight: 700;
 ">Uw eenmalige wachtwoord</p>

 <!-- OTP Digit Boxes -->
 <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px;">
 <tr>
 ${otpDigits}
 </tr>
 </table>

 <!-- Timer badge -->
 <div style="
 display: inline-block;
 background: #fff3cd;
 border: 1px solid #ffc107;
 border-radius: 99px;
 padding: 6px 18px;
 font-size: 13px;
 color: #856404;
 font-weight: 700;
 "> Verloopt over 5 minuten</div>

 </td>
 </tr>
 </table>

 <!-- Requested at note -->
 <p style="
 margin: 0 0 28px;
 font-size: 12px;
 color: #9ca3af;
 text-align: center;
 ">Aangevraagd op: ${requestedAt}</p>

 <!-- ===== SECURITY TIPS ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #f8f9fc;
 border: 1px solid #e8ecf5;
 border-radius: 12px;
 margin-bottom: 28px;
 ">
 <tr>
 <td style="padding: 20px 22px;">
 <p style="margin: 0 0 14px; font-size: 12px; color: #6b7a9f; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;"> Veiligheidsherinneringen</p>

 <!-- Tip 1 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10px;">
 <tr>
 <td style="width: 20px; vertical-align: top; padding-top: 1px; font-size: 14px;"></td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5;">
 Deze OTP is <strong>eenmalig te gebruiken</strong>. De code verloopt direct na gebruik.
 </td>
 </tr>
 </table>

 <!-- Tip 2 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10px;">
 <tr>
 <td style="width: 20px; vertical-align: top; padding-top: 1px; font-size: 14px;"></td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5;">
 <strong>Deel deze code nooit</strong> met iemand, ook niet met de klantenservice van Spandoek Print.
 </td>
 </tr>
 </table>

 <!-- Tip 3 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
 <tr>
 <td style="width: 20px; vertical-align: top; padding-top: 1px; font-size: 14px;"></td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5;">
 Deze code <strong>verloopt over 5 minuten</strong>. Vraag een nieuwe code aan als deze verloopt.
 </td>
 </tr>
 </table>
 </td>
 </tr>
 </table>

 <!-- ===== DIDN'T REQUEST THIS ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #fff5f5;
 border: 1px solid #fecaca;
 border-left: 4px solid #ef4444;
 border-radius: 10px;
 margin-bottom: 32px;
 ">
 <tr>
 <td style="padding: 16px 18px;">
 <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.8px;"> Heeft u dit niet aangevraagd?</p>
 <p style="margin: 0; font-size: 13.5px; color: #7f1d1d; line-height: 1.6;">
 Als u geen wachtwoordherstel hebt aangevraagd, kunt u deze e-mail negeren. Uw wachtwoord blijft ongewijzigd.
 Als u denkt dat uw account risico loopt,
 <a href="${config.client_url}/contact" style="color: #1a3faa; font-weight: 600;">neem dan direct contact op met onze klantenservice</a>.
 </p>
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
 <strong>Hulp nodig?</strong> Als u problemen hebt met het opnieuw instellen van uw wachtwoord,
 staat onze klantenservice voor u klaar.
 <a href="${config.client_url}/contact" style="color: #1a3faa; font-weight: 600;">Bezoek het Helpcenter</a>.
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
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/logo.png"
 width="200"
 alt="Spandoek Print"
 style="display:block; margin: 0 auto 12px; opacity: 0.85; background:#ffffff; padding:8px 14px; border-radius:8px;"
 />
 <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #1a3faa;">Spandoek Print</p>
 <p style="margin: 0 0 12px; font-size: 12px; color: #9ca3b8; line-height: 1.6;">
 Neonweg 200, 1362 AE Almere, Netherlands<br/>
 <a href="mailto:info@spandoekprint.nl" style="color: #9ca3b8;">info@spandoekprint.nl</a>
 </p>
 <p style="margin: 0; font-size: 11.5px; color: #b0b8cc; line-height: 1.6;">
 Deze e-mail is verzonden naar <strong>${email}</strong> omdat er wachtwoordherstel voor uw account is aangevraagd.<br/>
 Als u dit niet was, hoeft u niets te doen. Uw wachtwoord is niet gewijzigd.<br/>
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
