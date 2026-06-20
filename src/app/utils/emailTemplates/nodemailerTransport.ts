// import nodemailer from "nodemailer";

// type Attachment = {
//   filename: string;
//   path: string;
//   contentType?: string;
// };

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT || 587),
//   secure: true,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
//   // tls: {
//   //   rejectUnauthorized: false,
//   // },
// });

// const sendEmail = async (
//   to: string,
//   subject: string,
//   html: string,
//   text?: string,
//   attachments: Attachment[] = [],
// ) => {
//   if (!to) {
//     throw new Error("Email recipient is missing");
//   }

//   if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
//     throw new Error("SMTP configuration is missing");
//   }

//   try {
//     await transporter.verify();

//     const info = await transporter.sendMail({
//       from: process.env.SMTP_FROM || `"Spandoek Print" <${process.env.SMTP_USER}>`,
//       to,
//       subject,
//       html,
//       text,
//       attachments,
//     });

//     console.log("Email sent successfully:", {
//       to,
//       subject,
//       messageId: info.messageId,
//       accepted: info.accepted,
//       rejected: info.rejected,
//       response: info.response,
//     });

//     return info;
//   } catch (error: any) {
//     console.error("sendEmail failed:", {
//       to,
//       subject,
//       name: error.name,
//       message: error.message,
//       code: error.code,
//       command: error.command,
//       response: error.response,
//       responseCode: error.responseCode,
//       stack: error.stack,
//     });

//     throw error;
//   }
// };

// export default sendEmail;



import nodemailer from "nodemailer";

type Attachment = {
  filename: string;
  path: string;
  contentType?: string;
};

// Check the port dynamically to set the correct security protocol
const isSecure = process.env.SMTP_PORT === "465";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: isSecure, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Helps bypass local/hosting SSL handshake strictness
  },
});

const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
  attachments: Attachment[] = [],
) => {
  if (!to) {
    throw new Error("Email recipient is missing");
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP configuration is missing");
  }

  try {
    await transporter.verify();

    const info = await transporter.sendMail({
      // CRITICAL: Ensure process.env.SMTP_FROM uses the EXACT same email address as SMTP_USER
      from: process.env.SMTP_FROM || `"Spandoek Print" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });

    console.log("Email sent successfully:", {
      to,
      subject,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    return info;
  } catch (error: any) {
    console.error("sendEmail failed:", {
      to,
      subject,
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });

    throw error;
  }
};

export default sendEmail;