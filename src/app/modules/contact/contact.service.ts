import config from "../../../config";
import sendEmail from "../../utils/emailTemplates/nodemailerTransport";

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const sendContactEmails = async (data: ContactData) => {
  const { name, email, phone, subject, message } = data;

  const adminEmail = config.admin.contact.email || "info@spandoekprint.nl";

  // HTML template for admin email
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: #10b981; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Nieuw contactbericht</h1>
        <p style="color: #d1fae5; margin: 4px 0 0; font-size: 14px;">Via het contactformulier op spandoekprint.nl</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; width: 130px;">
              <strong style="color: #374151; font-size: 13px;">Naam</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <strong style="color: #374151; font-size: 13px;">E-mail</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <a href="mailto:${email}" style="color: #10b981; font-size: 14px;">${email}</a>
            </td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <strong style="color: #374151; font-size: 13px;">Telefoon</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">${phone}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
              <strong style="color: #374151; font-size: 13px;">Onderwerp</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px;">${subject}</td>
          </tr>
        </table>
        <div style="margin-top: 20px;">
          <strong style="color: #374151; font-size: 13px; display: block; margin-bottom: 8px;">Bericht</strong>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        <div style="margin-top: 20px; padding: 12px 16px; background: #ecfdf5; border-radius: 8px; border-left: 3px solid #10b981;">
          <p style="margin: 0; font-size: 12px; color: #065f46;">
            💡 Klik op "Beantwoorden" in uw e-mailclient om direct te reageren naar <strong>${email}</strong>.
          </p>
        </div>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
        © ${new Date().getFullYear()} Spandoekprint — Neonweg 200, 1362AE Almere
      </p>
    </div>
  `;

  // Email to admin
  await sendEmail(
    adminEmail,
    `[Contact] ${subject} — van ${name}`,
    adminHtml
  );

  // HTML template for user auto-reply email
  const userHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: #10b981; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Bedankt voor uw bericht!</h1>
        <p style="color: #d1fae5; margin: 4px 0 0; font-size: 14px;">Spandoekprint — Uw spandoek specialist</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">Beste <strong>${name}</strong>,</p>
        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          Wij hebben uw bericht met onderwerp <strong>"${subject}"</strong> in goede orde ontvangen.
          Ons team neemt zo snel mogelijk contact met u op, doorgaans binnen 1 werkdag.
        </p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Uw bericht</p>
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          Heeft u een dringende vraag? Neem dan direct contact op:
        </p>
        <ul style="color: #374151; font-size: 14px; line-height: 2;">
          <li>📧 <a href="mailto:info@spandoekprint.nl" style="color: #10b981;">info@spandoekprint.nl</a></li>
          <li>📞 <a href="tel:0362340066" style="color: #10b981;">036 234 0066</a></li>
        </ul>
        <p style="color: #374151; font-size: 14px; margin-top: 20px;">
          Met vriendelijke groet,<br/>
          <strong>Het Spandoekprint team</strong>
        </p>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
        © ${new Date().getFullYear()} Spandoekprint — Neonweg 200, 1362AE Almere
      </p>
    </div>
  `;

  // Auto-reply email to the sender
  await sendEmail(
    email,
    "Wij hebben uw bericht ontvangen — Spandoekprint",
    userHtml
  );
};

export const contactService = {
  sendContactEmails,
};
