import sendEmail from "./nodemailerTransport";
import config from "../../../config";

interface RegistrationOTPData {
 userName: string;
 email: string;
 otp: string;
 requestedAt: string;
}

export const registrationOtpTemplate = async (data: RegistrationOTPData) => {
 const { userName, email, otp, requestedAt } = data;

 const subject = "Welkom bij Spandoek Print - Verifieer uw e-mailadres";

 const otpDigits = otp
 .split("")
 .map(
 (digit) => `
 <td style="padding: 0 5px;">
 <div style="
 width: 50px;
 height: 60px;
 background: #ffffff;
 border: 2px solid #1a3faa;
 border-radius: 10px;
 font-size: 28px;
 font-weight: 800;
 color: #1a3faa;
 text-align: center;
 line-height: 60px;
 box-shadow: 0 2px 10px rgba(26,63,170,0.13);
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
 <title>Verifieer uw e-mailadres</title>
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
 background: linear-gradient(135deg, #1a3faa 0%, #2d63e2 60%, #3b82f6 100%);
 padding: 40px 40px 36px;
 text-align: center;
 ">
 <!-- Logo -->
 <img
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
 width="300"
 alt="Spandoek Print"
 style="display:block; margin: 0 auto 24px; border-radius: 8px; background:#ffffff; padding:10px 18px;"
 />

 <!-- Email verify icon -->
 <div style="
 display: inline-block;
 background: rgba(255,255,255,0.15);
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
 ">Verifieer uw e-mailadres</h1>

 <p style="
 margin: 0;
 color: rgba(255,255,255,0.82);
 font-size: 15px;
 line-height: 1.65;
 ">
 You're almost there! Enter the OTP below to<br/>
 activate your <strong style="color:#ffffff;">Spandoek Print</strong> account.
 </p>
 </td>
 </tr>

 <!-- ===== BODY ===== -->
 <tr>
 <td style="padding: 36px 40px 0;">

 <!-- Greeting -->
 <p style="margin: 0 0 8px; font-size: 16px; color: #1a1a2e; font-weight: 600;">
 Welkom, ${userName}! 
 </p>
 <p style="margin: 0 0 30px; font-size: 15px; color: #555e7a; line-height: 1.75;">
 Bedankt dat u een account hebt aangemaakt bij
 <strong style="color:#1a3faa;">Spandoek Print</strong>.
 Om uw registratie te voltooien en uw account te activeren,
 verifieert u uw e-mailadres met de 6-cijferige OTP-code hieronder.
 </p>

 <!-- ===== OTP BOX ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
 border: 1px solid #c7d7fd;
 border-radius: 14px;
 margin-bottom: 10px;
 ">
 <tr>
 <td style="padding: 32px 20px 26px; text-align: center;">

 <p style="
 margin: 0 0 6px;
 font-size: 12px;
 color: #6b7a9f;
 text-transform: uppercase;
 letter-spacing: 1.5px;
 font-weight: 700;
 ">Uw verificatiecode voor e-mail</p>

 <p style="
 margin: 0 0 20px;
 font-size: 13px;
 color: #9ca3af;
 ">Voer deze code in om uw account te verifiren</p>

 <!-- OTP digit boxes -->
 <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 22px;">
 <tr>
 ${otpDigits}
 </tr>
 </table>

 <!-- Expiry badge -->
 <div style="
 display: inline-block;
 background: #fff3cd;
 border: 1px solid #ffc107;
 border-radius: 99px;
 padding: 6px 20px;
 font-size: 13px;
 color: #856404;
 font-weight: 700;
 "> Verloopt over 5 minuten</div>

 </td>
 </tr>
 </table>

 <!-- Requested at -->
 <p style="
 margin: 0 0 30px;
 font-size: 12px;
 color: #9ca3af;
 text-align: center;
 ">Aangevraagd op: ${requestedAt}</p>

 <!-- ===== WHAT YOU GET SECTION ===== -->
 <p style="
 margin: 0 0 14px;
 font-size: 13px;
 color: #6b7a9f;
 text-transform: uppercase;
 letter-spacing: 1px;
 font-weight: 700;
 ">Waarom uw e-mailadres verifieren?</p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 border-collapse: collapse;
 border-radius: 12px;
 overflow: hidden;
 border: 1px solid #e8ecf5;
 margin-bottom: 28px;
 ">
 <!-- Benefit 1 -->
 <tr>
 <td style="
 padding: 14px 18px;
 background: #f8f9fc;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13.5px;
 color: #374151;
 line-height: 1.5;
 ">
 <strong>Beveilig uw account</strong> Bescherm uw gegevens en voorkom ongeautoriseerde toegang.
 </td>
 </tr>
 <!-- Benefit 2 -->
 <tr>
 <td style="
 padding: 14px 18px;
 background: #ffffff;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13.5px;
 color: #374151;
 line-height: 1.5;
 ">
 <strong>Plaats en volg bestellingen</strong> Beheer uw printbestellingen en ontvang realtime updates.
 </td>
 </tr>
 <!-- Benefit 3 -->
 <tr>
 <td style="
 padding: 14px 18px;
 background: #f8f9fc;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13.5px;
 color: #374151;
 line-height: 1.5;
 ">
 <strong>Exclusieve deals en aanbiedingen</strong> Ontvang als eerste kortingen alleen voor leden.
 </td>
 </tr>
 <!-- Benefit 4 -->
 <tr>
 <td style="
 padding: 14px 18px;
 background: #ffffff;
 font-size: 13.5px;
 color: #374151;
 line-height: 1.5;
 ">
 <strong>Sneller afrekenen</strong> Bewaar uw gegevens voor snelle en soepele aankopen.
 </td>
 </tr>
 </table>

 <!-- ===== SECURITY NOTE ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #f8f9fc;
 border: 1px solid #e8ecf5;
 border-radius: 12px;
 margin-bottom: 28px;
 ">
 <tr>
 <td style="padding: 18px 22px;">
 <p style="margin: 0 0 12px; font-size: 12px; color: #6b7a9f; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;"> Veiligheidsherinneringen</p>

 <!-- Tip 1 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10px;">
 <tr>
 <td style="width: 20px; vertical-align: top; font-size: 14px; padding-top: 1px;"></td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5;">
 Deze OTP is <strong>eenmalig te gebruiken</strong> en 5 minuten geldig.
 </td>
 </tr>
 </table>

 <!-- Tip 2 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10px;">
 <tr>
 <td style="width: 20px; vertical-align: top; font-size: 14px; padding-top: 1px;"></td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5;">
 <strong>Deel deze code nooit</strong> met iemand, ook niet met onze klantenservice.
 </td>
 </tr>
 </table>

 <!-- Tip 3 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
 <tr>
 <td style="width: 20px; vertical-align: top; font-size: 14px; padding-top: 1px;"></td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5;">
 Als de code verloopt, kunt u op de verificatiepagina <strong>een nieuwe OTP aanvragen</strong>.
 </td>
 </tr>
 </table>
 </td>
 </tr>
 </table>

 <!-- ===== DIDN'T REGISTER? ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #fff5f5;
 border: 1px solid #fecaca;
 border-left: 4px solid #ef4444;
 border-radius: 10px;
 margin-bottom: 32px;
 ">
 <tr>
 <td style="padding: 16px 18px;">
 <p style="margin: 0 0 5px; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.8px;"> Heeft u geen account aangemaakt?</p>
 <p style="margin: 0; font-size: 13.5px; color: #7f1d1d; line-height: 1.6;">
 Als u zich niet hebt geregistreerd bij Spandoek Print, kunt u deze e-mail negeren. Er wordt geen account aangemaakt.
 Als u denkt dat iemand uw e-mailadres misbruikt,
 <a href="${config.client_url}/contact" style="color: #1a3faa; font-weight: 600;">neem contact op met onze klantenservice</a>.
 </p>
 </td>
 </tr>
 </table>

 <!-- ===== DIVIDER ===== -->
 <hr style="border: none; border-top: 1px solid #e8ecf5; margin: 0 0 24px;" />

 <!-- ===== SUPPORT ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #fffbeb;
 border: 1px solid #fde68a;
 border-radius: 10px;
 margin-bottom: 32px;
 ">
 <tr>
 <td style="padding: 16px 18px;">
 <p style="margin: 0; font-size: 13.5px; color: #78450f; line-height: 1.6;">
 <strong>Hulp nodig?</strong> Als u problemen hebt met het verifiren van uw account,
 staat onze klantenservice klaar om u te helpen.
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
 src="https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/images/image-removebg-preview.png"
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
 Deze e-mail is verzonden naar <strong>${email}</strong> omdat er met dit adres een account is geregistreerd.<br/>
 Als u dit niet was, kunt u deze e-mail negeren. Er wordt geen account geactiveerd.<br/>
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
