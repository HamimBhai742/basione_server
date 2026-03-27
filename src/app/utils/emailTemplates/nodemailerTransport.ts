import nodemailer from 'nodemailer';
import config from "../../../config";

const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    // host: "mail.newmodina.com",
    service: "gmail",
    // port: 465,
    // port: 587,
    // secure: true,
    auth: {
      user: config.smt.email,
      pass: config.smt.pass,
    },
    tls: {
      rejectUnauthorized: false,  // Optional: Bypass SSL issues if needed
    },
  });

  // Email options
  const mailOptions = {
    from: config.smt.email,
    // from: "support@deepbluedeal.com",
    to,
    subject,
    html,
    text,
  };
  await transporter.sendMail(mailOptions);
};

export default sendEmail;

