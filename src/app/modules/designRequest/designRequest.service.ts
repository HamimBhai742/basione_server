import { prisma } from "../../lib/prisma";
import { uploadFileToS3 } from "../../utils/uploadAws";
import sendEmail from "../../utils/emailTemplates/nodemailerTransport";

interface CreateDesignRequestPayload {
  name: string;
  email: string;
  phone?: string;
  dimensions: string;
  eyelets: string;
  requirements: string;
  files?: Express.Multer.File[];
}

const createDesignRequest = async (payload: CreateDesignRequestPayload) => {
  const { name, email, phone, dimensions, eyelets, requirements, files } =
    payload;

  const uploadedFileUrls: string[] = [];

  // Upload files to S3 Cloud Storage
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const fileUrl = await uploadFileToS3(file, "design-requests");
        uploadedFileUrls.push(fileUrl);
      } catch (error) {
        console.error("Failed to upload design request file to S3:", error);
      }
    }
  }

  // Save request in database
  const designRequest = await (prisma as any).designRequest.create({
    data: {
      name,
      email,
      phone: phone || null,
      dimensions,
      eyelets,
      requirements,
      fileUrls: uploadedFileUrls,
    },
  });

  // Target notification email
  const targetEmail =
    process.env.DESIGN_REQUEST_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL_CONTACT ||
    "info@spandoekprint.nl";

  // Build HTML for admin notification email
  const fileLinksHtml =
    uploadedFileUrls.length > 0
      ? uploadedFileUrls
          .map(
            (url, idx) =>
              `<li style="margin-bottom: 6px;"><a href="${url}" target="_blank" style="color: #10b981; word-break: break-all; font-weight: 600;">Bestand ${idx + 1} Downloaden / Bekijken</a></li>`,
          )
          .join("")
      : "<p style='color: #6b7280; font-style: italic; margin: 0;'>Geen bestanden bijgevoegd.</p>";

  const adminEmailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 28px; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Nieuwe Design Aanvraag</h1>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Ontworpen door ons team — spandoekprint.nl</p>
      </div>
      
      <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; width: 160px; font-weight: 600; color: #475569; font-size: 14px;">Klantnaam</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px; font-weight: 600;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569; font-size: 14px;">E-mailadres</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px;">
              <a href="mailto:${email}" style="color: #10b981; font-weight: 600; text-decoration: none;">${email}</a>
            </td>
          </tr>
          ${
            phone
              ? `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569; font-size: 14px;">Telefoonnummer</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px;">${phone}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569; font-size: 14px;">Gewenste Afmetingen</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px; font-weight: 600;">${dimensions}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569; font-size: 14px;">Ringogen / Eyelets</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 15px;">${eyelets}</td>
          </tr>
        </table>

        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 10px; font-size: 15px; color: #334155; font-weight: 700;">Wensen & Instructies</h3>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${requirements}</div>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 10px; font-size: 15px; color: #334155; font-weight: 700;">Upload Bestanden (${uploadedFileUrls.length})</h3>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px;">
            <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
              ${fileLinksHtml}
            </ul>
          </div>
        </div>

        <div style="padding: 14px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6; color: #1e40af; font-size: 13px;">
          💡 <strong>Tip:</strong> Reageer direct op dit bericht om contact op te nemen met <strong>${email}</strong>.
        </div>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
        © ${new Date().getFullYear()} Spandoekprint. All rights reserved.
      </p>
    </div>
  `;

  // Send email to target admin/testing email
  try {
    await sendEmail(
      targetEmail,
      `[Design Aanvraag] ${dimensions} — van ${name}`,
      adminEmailHtml,
    );
  } catch (error) {
    console.error("Failed to send admin design request email:", error);
  }

  // Send auto-reply confirmation email to customer
  const customerEmailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 28px; border-radius: 12px 12px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Bedankt voor uw aanvraag!</h1>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Het ontwerpteam van Spandoekprint gaat voor u aan de slag</p>
      </div>

      <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Beste <strong>${name}</strong>,</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Wij hebben uw aanvraag voor een op maat gemaakt spandoek in goede orde ontvangen. 
          Ons professionele ontwerpteam gaat uw wensen bekijken en neemt zo snel mogelijk contact met u op.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
          <h4 style="margin: 0 0 12px; color: #0f172a; font-size: 14px;">Samenvatting van uw aanvraag:</h4>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">• <strong>Afmetingen:</strong> ${dimensions}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">• <strong>Ringogen:</strong> ${eyelets}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">• <strong>Aantal upload bestanden:</strong> ${uploadedFileUrls.length}</p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Heeft u tussentijds nog aanvullende vragen of bestanden? Neem gerust contact met ons op via <a href="mailto:info@spandoekprint.nl" style="color: #10b981; font-weight: 600;">info@spandoekprint.nl</a>.
        </p>

        <p style="color: #334155; font-size: 14px; margin-top: 24px;">
          Met vriendelijke groet,<br/>
          <strong>Het Spandoekprint Ontwerpteam</strong>
        </p>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
        © ${new Date().getFullYear()} Spandoekprint — Neonweg 200, 1362AE Almere
      </p>
    </div>
  `;

  try {
    await sendEmail(
      email,
      "Wij hebben uw design aanvraag ontvangen — Spandoekprint",
      customerEmailHtml,
    );
  } catch (error) {
    console.error("Failed to send customer confirmation email:", error);
  }

  return designRequest;
};

export const designRequestService = {
  createDesignRequest,
};
