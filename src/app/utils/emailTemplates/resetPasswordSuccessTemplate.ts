import config from "../../../config";
import sendEmail from "./nodemailerTransport";

interface ResetPasswordSuccessData {
 userName: string;
 email: string;
 resetAt: string;
 ipAddress?: string;
 device?: string;
 location?: string;
}

export const resetPasswordSuccessTemplate = async (
 data: ResetPasswordSuccessData,
) => {
 const { userName, email, resetAt, ipAddress, device, location } = data;

 const subject = "Uw wachtwoord is succesvol opnieuw ingesteld";

 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
 <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <title>Wachtwoord succesvol opnieuw ingesteld</title>
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
 background: linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%);
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

 <!-- Shield success icon circle -->
 <div style="
 display: inline-block;
 background: rgba(255,255,255,0.15);
 border: 3px solid rgba(255,255,255,0.40);
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
 ">Wachtwoord succesvol opnieuw ingesteld</h1>

 <p style="
 margin: 0;
 color: rgba(255,255,255,0.82);
 font-size: 15px;
 line-height: 1.6;
 ">
 Uw wachtwoord is bijgewerkt en uw account is beveiligd.
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
 <p style="margin: 0 0 28px; font-size: 15px; color: #555e7a; line-height: 1.75;">
 Dit is een bevestiging dat het wachtwoord voor uw
 <strong style="color:#1a3faa;">Spandoek Print</strong> account gekoppeld aan
 <strong style="color:#1a1a2e;">${email}</strong> has been
 <strong style="color:#059669;">succesvol opnieuw is ingesteld</strong>.
 U kunt nu inloggen met uw nieuwe wachtwoord.
 </p>

 <!-- ===== SUCCESS BANNER ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
 border: 1px solid #86efac;
 border-radius: 14px;
 margin-bottom: 28px;
 ">
 <tr>
 <td style="padding: 22px 24px; text-align: center;">
 <p style="margin: 0 0 6px; font-size: 13px; color: #16a34a; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700;">Accountstatus</p>
 <p style="margin: 0 0 10px; font-size: 24px; font-weight: 800; color: #15803d; letter-spacing: -0.5px;"> Wachtwoord bijgewerkt</p>
 <div style="
 display: inline-block;
 background: #16a34a;
 border-radius: 99px;
 padding: 5px 18px;
 ">
 <span style="font-size: 13px; color: #ffffff; font-weight: 700;"> Uw account is beveiligd</span>
 </div>
 </td>
 </tr>
 </table>

 <!-- ===== RESET DETAILS ===== -->
 <p style="
 margin: 0 0 12px;
 font-size: 13px;
 color: #6b7a9f;
 text-transform: uppercase;
 letter-spacing: 1px;
 font-weight: 700;
 ">Resetgegevens</p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 border-collapse: collapse;
 border-radius: 10px;
 overflow: hidden;
 border: 1px solid #e8ecf5;
 margin-bottom: 28px;
 ">
 <!-- Reset At -->
 <tr>
 <td style="
 padding: 13px 18px;
 background: #f8f9fc;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #6b7a9f;
 font-weight: 600;
 width: 38%;
 "> Datum en tijd</td>
 <td style="
 padding: 13px 18px;
 background: #f8f9fc;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #1a1a2e;
 font-weight: 500;
 ">${resetAt}</td>
 </tr>

 <!-- Apparaat (conditional) -->
 ${
 device
 ? `
 <tr>
 <td style="
 padding: 13px 18px;
 background: #ffffff;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #6b7a9f;
 font-weight: 600;
 "> Apparaat</td>
 <td style="
 padding: 13px 18px;
 background: #ffffff;
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #1a1a2e;
 font-weight: 500;
 ">${device}</td>
 </tr>
 `
 : ""
 }

 <!-- Locatie (conditional) -->
 ${
 location
 ? `
 <tr>
 <td style="
 padding: 13px 18px;
 background: ${ipAddress ? "#f8f9fc" : "#ffffff"};
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #6b7a9f;
 font-weight: 600;
 "> Locatie</td>
 <td style="
 padding: 13px 18px;
 background: ${ipAddress ? "#f8f9fc" : "#ffffff"};
 border-bottom: 1px solid #e8ecf5;
 font-size: 13px;
 color: #1a1a2e;
 font-weight: 500;
 ">${location}</td>
 </tr>
 `
 : ""
 }

 <!-- IP-adres (conditional) -->
 ${
 ipAddress
 ? `
 <tr>
 <td style="
 padding: 13px 18px;
 background: #ffffff;
 font-size: 13px;
 color: #6b7a9f;
 font-weight: 600;
 "> IP-adres</td>
 <td style="
 padding: 13px 18px;
 background: #ffffff;
 font-size: 13px;
 color: #1a1a2e;
 font-weight: 500;
 font-family: 'Courier New', monospace;
 ">${ipAddress}</td>
 </tr>
 `
 : ""
 }
 </table>

 <!-- ===== WHAT'S NEXT ===== -->
 <p style="
 margin: 0 0 12px;
 font-size: 13px;
 color: #6b7a9f;
 text-transform: uppercase;
 letter-spacing: 1px;
 font-weight: 700;
 ">Wat nu?</p>

 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #f8f9fc;
 border: 1px solid #e8ecf5;
 border-radius: 12px;
 margin-bottom: 28px;
 ">
 <tr>
 <td style="padding: 18px 20px;">

 <!-- Step 1 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 14px;">
 <tr>
 <td style="width: 30px; vertical-align: top;">
 <div style="
 width: 24px;
 height: 24px;
 background: #059669;
 border-radius: 50%;
 color: #fff;
 font-size: 12px;
 font-weight: 700;
 text-align: center;
 line-height: 24px;
 ">1</div>
 </td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
 <strong>Log in met uw nieuwe wachtwoord</strong> Ga naar de inlogpagina en meld u aan met uw bijgewerkte gegevens.
 </td>
 </tr>
 </table>

 <!-- Step 2 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 14px;">
 <tr>
 <td style="width: 30px; vertical-align: top;">
 <div style="
 width: 24px;
 height: 24px;
 background: #059669;
 border-radius: 50%;
 color: #fff;
 font-size: 12px;
 font-weight: 700;
 text-align: center;
 line-height: 24px;
 ">2</div>
 </td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
 <strong>Gebruik een sterk, uniek wachtwoord</strong> Gebruik oude wachtwoorden niet opnieuw op verschillende websites.
 </td>
 </tr>
 </table>

 <!-- Step 3 -->
 <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
 <tr>
 <td style="width: 30px; vertical-align: top;">
 <div style="
 width: 24px;
 height: 24px;
 background: #059669;
 border-radius: 50%;
 color: #fff;
 font-size: 12px;
 font-weight: 700;
 text-align: center;
 line-height: 24px;
 ">3</div>
 </td>
 <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
 <strong>Log uit op alle andere apparaten</strong> Als u ongeautoriseerde toegang vermoedt, log dan direct uit bij alle sessies via uw accountinstellingen.
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
 href="${config.client_url}/signIn"
 style="
 display: inline-block;
 background: linear-gradient(135deg, #059669, #10b981);
 color: #ffffff;
 text-decoration: none;
 font-size: 15px;
 font-weight: 700;
 padding: 14px 40px;
 border-radius: 10px;
 letter-spacing: 0.3px;
 box-shadow: 0 4px 14px rgba(5,150,105,0.32);
 "
 >
 Log in op uw account 
 </a>
 </td>
 </tr>
 </table>

 <!-- ===== DIVIDER ===== -->
 <hr style="border: none; border-top: 1px solid #e8ecf5; margin: 0 0 24px;" />

 <!-- ===== SECURITY ALERT ===== -->
 <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
 background: #fff5f5;
 border: 1px solid #fecaca;
 border-left: 4px solid #ef4444;
 border-radius: 10px;
 margin-bottom: 32px;
 ">
 <tr>
 <td style="padding: 16px 18px;">
 <p style="margin: 0 0 5px; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.8px;"> Was u dit niet?</p>
 <p style="margin: 0; font-size: 13.5px; color: #7f1d1d; line-height: 1.6;">
 Als u uw wachtwoord <strong>niet</strong> opnieuw hebt ingesteld, kan uw account risico lopen.
 <a href="${config.client_url}/contact" style="color: #1a3faa; font-weight: 600;">Neem direct contact op met onze klantenservice</a>
 en beveilig uw account door uw wachtwoord opnieuw in te stellen.
 </p>
 </td>
 </tr>
 </table>

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
 <strong>Hulp nodig?</strong> Als u problemen hebt met inloggen of zorgen hebt over de beveiliging van uw account,
 <a href="${config.client_url}/contact" style="color: #1a3faa; font-weight: 600;">bezoek ons Helpcenter</a> of beantwoord deze e-mail.
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
 Deze beveiligingsmelding is verzonden naar <strong>${email}</strong> omdat het wachtwoord van uw account opnieuw is ingesteld.<br/>
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
