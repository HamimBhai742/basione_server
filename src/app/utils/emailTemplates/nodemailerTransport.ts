import nodemailer from "nodemailer";
import config from "../../../config";

type EmailAttachment = {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
};

const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
  attachments?: EmailAttachment[],
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.smt.email,
      pass: config.smt.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `Spandoek Print <${config.smt.email}>`,
    to,
    subject,
    html,
    text,
    attachments: attachments || [],
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;