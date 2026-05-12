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

  const subject = "✅ Payment Confirmed — Your Order is On Its Way!";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment Successful</title>
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
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="
          max-width: 600px;
          width: 100%;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        ">
          <tr>
            <td style="
              background: linear-gradient(135deg, #1a3faa 0%, #2d63e2 60%, #3b82f6 100%);
              padding: 40px 40px 32px;
              text-align: center;
            ">
              <img
                src="https://i.ibb.co.com/bjqdZXJm/spandoek-print-logo.png"
                width="300"
                alt="Spandoek Print"
                style="display:block; margin: 0 auto 24px; border-radius: 8px;"
              />

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
              ">✅</div>

              <h1 style="
                margin: 0 0 8px;
                color: #ffffff;
                font-size: 26px;
                font-weight: 700;
                letter-spacing: -0.3px;
              ">Payment Successful!</h1>

              <p style="
                margin: 0;
                color: rgba(255,255,255,0.82);
                font-size: 15px;
              ">Your order has been confirmed and is now being processed.</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 36px 40px 0;">
              <p style="
                margin: 0 0 8px;
                font-size: 16px;
                color: #1a1a2e;
                font-weight: 600;
              ">Hello, ${userName} 👋</p>

              <p style="
                margin: 0 0 28px;
                font-size: 15px;
                color: #555e7a;
                line-height: 1.7;
              ">
                Thank you for shopping with <strong style="color:#1a3faa;">Spandoek Print</strong>.
                Your payment was received and processed successfully. Below is a summary of your transaction for your records.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
                border-radius: 12px;
                margin-bottom: 28px;
                border: 1px solid #d0dcf8;
              ">
                <tr>
                  <td style="padding: 22px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 13px; color: #6b7a9f; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Amount Paid</p>
                    <p style="margin: 0; font-size: 38px; font-weight: 800; color: #1a3faa; letter-spacing: -1px;">€${Number(amount || 0).toFixed(2)}</p>
                  </td>
                </tr>
              </table>

              <p style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">Transaction Details</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                border-collapse: collapse;
                border-radius: 10px;
                overflow: hidden;
                border: 1px solid #e8ecf5;
                margin-bottom: 32px;
              ">
                <tr>
                  <td style="padding: 14px 18px; background: #f8f9fc; border-bottom: 1px solid #e8ecf5; font-size: 13px; color: #6b7a9f; font-weight: 600; width: 40%;">🔖 Order ID</td>
                  <td style="padding: 14px 18px; background: #f8f9fc; border-bottom: 1px solid #e8ecf5; font-size: 13px; color: #1a1a2e; font-weight: 500; font-family: 'Courier New', monospace;">${orderId}</td>
                </tr>

                <tr>
                  <td style="padding: 14px 18px; background: #ffffff; border-bottom: 1px solid #e8ecf5; font-size: 13px; color: #6b7a9f; font-weight: 600;">💳 Transaction ID</td>
                  <td style="padding: 14px 18px; background: #ffffff; border-bottom: 1px solid #e8ecf5; font-size: 13px; color: #1a1a2e; font-weight: 500; font-family: 'Courier New', monospace;">${transactionId}</td>
                </tr>

                ${
                  invoiceNumber
                    ? `
                <tr>
                  <td style="padding: 14px 18px; background: #f8f9fc; border-bottom: 1px solid #e8ecf5; font-size: 13px; color: #6b7a9f; font-weight: 600;">🧾 Invoice Number</td>
                  <td style="padding: 14px 18px; background: #f8f9fc; border-bottom: 1px solid #e8ecf5; font-size: 13px; color: #1a1a2e; font-weight: 500; font-family: 'Courier New', monospace;">${invoiceNumber}</td>
                </tr>
                    `
                    : ""
                }

                <tr>
                  <td style="padding: 14px 18px; background: #ffffff; font-size: 13px; color: #6b7a9f; font-weight: 600;">📅 Date & Time</td>
                  <td style="padding: 14px 18px; background: #ffffff; font-size: 13px; color: #1a1a2e; font-weight: 500;">${date}</td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="
                          background: #d1fae5;
                          border: 1px solid #6ee7b7;
                          border-radius: 99px;
                          padding: 6px 16px;
                        ">
                          <span style="font-size: 13px; color: #065f46; font-weight: 700;">● Payment Status: Paid</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${
                invoiceUrl
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 10px;
                margin-bottom: 32px;
              ">
                <tr>
                  <td style="padding: 18px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #1e3a8a; line-height: 1.6;">
                      🧾 <strong>Your invoice is ready.</strong><br/>
                      You can download your PDF invoice using the button below.
                    </p>

                    <a
                      href="${invoiceUrl}"
                      target="_blank"
                      style="
                        display: inline-block;
                        background: #2563eb;
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 14px;
                        font-weight: 700;
                        padding: 11px 18px;
                        border-radius: 8px;
                      "
                    >
                      Download Invoice
                    </a>
                  </td>
                </tr>
              </table>
                  `
                  : ""
              }

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a
                      href="https://your-frontend-url.com/dashboard"
                      style="
                        display: inline-block;
                        background: linear-gradient(135deg, #1a3faa, #2d63e2);
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 15px;
                        font-weight: 700;
                        padding: 14px 36px;
                        border-radius: 10px;
                        letter-spacing: 0.3px;
                        box-shadow: 0 4px 14px rgba(34,92,228,0.35);
                      "
                    >
                      View Your Order →
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e8ecf5; margin: 0 0 24px;" />

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-radius: 10px;
                margin-bottom: 32px;
              ">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0; font-size: 13.5px; color: #78450f; line-height: 1.6;">
                      💬 <strong>Need help?</strong> If you have any questions about your order or payment,
                      our support team is here for you.
                      Reply to this email or visit our
                      <a href="https://your-frontend-url.com/customer-service" style="color: #1a3faa; font-weight: 600;">Customer Service</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="
              background: #f8f9fc;
              border-top: 1px solid #e8ecf5;
              padding: 28px 40px;
              text-align: center;
            ">
              <img
                src="https://i.ibb.co.com/bjqdZXJm/spandoek-print-logo.png"
                width="200"
                alt="Spandoek Print"
                style="display:block; margin: 0 auto 12px; opacity: 0.7;"
              />
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #1a3faa;">Spandoek Print</p>
              <p style="margin: 0 0 12px; font-size: 12px; color: #9ca3b8; line-height: 1.6;">
                123 Print Avenue, Amsterdam, Netherlands<br/>
                <a href="mailto:support@spandoekprint.com" style="color: #9ca3b8;">support@spandoekprint.com</a>
              </p>
              <p style="margin: 0; font-size: 11.5px; color: #b0b8cc; line-height: 1.6;">
                This email was sent to <strong>${email}</strong> because you made a purchase on Spandoek Print.<br/>
                © ${new Date().getFullYear()} Spandoek Print. All rights reserved.
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

  await sendEmail(
    email,
    subject,
    html,
    undefined,
    invoiceFilePath
      ? [
          {
            filename: `${invoiceNumber || "invoice"}.pdf`,
            path: invoiceFilePath,
            contentType: "application/pdf",
          },
        ]
      : [],
  );
};