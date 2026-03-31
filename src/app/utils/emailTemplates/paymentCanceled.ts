import sendEmail from "./nodemailerTransport";

interface PaymentCancelledData {
  userName: string;
  email: string;
  amount: number;
  transactionId: string;
  orderId: string;
  date: string;
  cancelReason?: string;
}

export const paymentCancelledTemplate = async (data: PaymentCancelledData) => {
  const { userName, email, amount, transactionId, orderId, date, cancelReason } = data;

  const subject = "🚫 Payment Cancelled — Your Order Has Been Cancelled";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment Cancelled</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f0f0f4;
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f0f4; padding: 40px 16px;">
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
            <td style="text-align: center;">
              <!-- Logo -->
              <img
                src="https://i.ibb.co.com/JwZrfwqT/spandoek-print-logo.png"
                width="300px"
                alt="Spandoek Print"
                style="display:block; margin: 0 auto 24px; border-radius: 8px;"
              />

              <!-- Cancelled icon circle -->
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
              ">🚫</div>

              <h1 style="
                margin: 0 0 8px;
                color: #dc2626;
                font-size: 26px;
                font-weight: 700;
                letter-spacing: -0.3px;
              ">Payment Cancelled</h1>

              <p style="
                margin: 0;
                color: rgba(255,255,255,0.82);
                font-size: 15px;
              ">Your payment and order have been successfully cancelled.</p>
            </td>
          </tr>

          <!-- ===== BODY CONTENT ===== -->
          <tr>
            <td style="padding: 0px 40px 0;">

              <!-- Greeting -->
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
                We wanted to let you know that your payment of
                <strong style="color:#4b5563;">$${amount.toFixed(2)}</strong>
                to <strong style="color:#1a3faa;">Spandoek Print</strong> has been cancelled.
                No charge has been made to your account.
              </p>

              <!-- ===== AMOUNT HIGHLIGHT ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                border-radius: 12px;
                margin-bottom: 28px;
                border: 1px solid #d1d5db;
              ">
                <tr>
                  <td style="padding: 22px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Cancelled Amount</p>
                    <p style="margin: 0 0 6px; font-size: 38px; font-weight: 800; color: #374151; letter-spacing: -1px; text-decoration: line-through; opacity: 0.6;">$${amount.toFixed(2)}</p>
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">No charge was applied to your account.</p>
                  </td>
                </tr>
              </table>

              <!-- ===== CANCEL REASON BOX ===== -->
              ${cancelReason ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #f8f9fc;
                border: 1px solid #d1d5db;
                border-left: 4px solid #6b7280;
                border-radius: 10px;
                margin-bottom: 28px;
              ">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.8px;">Cancellation Reason</p>
                    <p style="margin: 0; font-size: 14px; color: #374151;">${cancelReason}</p>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- ===== ORDER DETAILS TABLE ===== -->
              <p style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">Cancelled Order Details</p>

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
                  ">🔖 Order ID</td>
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
                  ">💳 Transaction ID</td>
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
                  ">📅 Date & Time</td>
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
                          background: #f3f4f6;
                          border: 1px solid #d1d5db;
                          border-radius: 99px;
                          padding: 6px 16px;
                        ">
                          <span style="font-size: 13px; color: #374151; font-weight: 700;">● Payment Status: Cancelled</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ===== REFUND NOTICE ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-left: 4px solid #22c55e;
                border-radius: 10px;
                margin-bottom: 28px;
              ">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.8px;">💚 Refund Information</p>
                    <p style="margin: 0; font-size: 13.5px; color: #166534; line-height: 1.6;">
                      If any amount was charged, a full refund will be processed to your original payment method within <strong>5–7 business days</strong>, depending on your bank.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- ===== SHOP AGAIN CTA ===== -->
              <p style="
                margin: 0 0 16px;
                font-size: 15px;
                color: #555e7a;
                line-height: 1.7;
                text-align: center;
              ">
                Changed your mind? You're always welcome back. 🛍️
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a
                      href="https://your-frontend-url.com/shop"
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
                        box-shadow: 0 4px 14px rgba(34,92,228,0.3);
                        margin-right: 12px;
                      "
                    >
                      Shop Again →
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
                      💬 <strong>Have questions?</strong> If you didn't request this cancellation or need further assistance,
                      please contact our support team immediately.
                      <a href="https://your-frontend-url.com/support" style="color: #1a3faa; font-weight: 600;">Visit Help Center</a>.
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
                src="https://i.ibb.co.com/JwZrfwqT/spandoek-print-logo.png"
                width="150px"
                alt="Spandoek Print"
                style="display:block; margin: 0 auto 12px; opacity: 0.7;"
              />
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #1a3faa;">Spandoek Print</p>
              <p style="margin: 0 0 12px; font-size: 12px; color: #9ca3b8; line-height: 1.6;">
                123 Print Avenue, Amsterdam, Netherlands<br/>
                <a href="mailto:support@spandoekprint.com" style="color: #9ca3b8;">support@spandoekprint.com</a>
              </p>
              <p style="margin: 0; font-size: 11.5px; color: #b0b8cc; line-height: 1.6;">
                This email was sent to <strong>${email}</strong> regarding a cancellation on your Spandoek Print account.<br/>
                © ${new Date().getFullYear()} Spandoek Print. All rights reserved.
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