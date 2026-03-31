import sendEmail from "./nodemailerTransport";

interface PaymentFailedData {
  userName: string;
  email: string;
  amount: number;
  transactionId: string;
  orderId: string;
  date: string;
  failureReason?: string;
}

export const paymentFailedTemplate = async (data: PaymentFailedData) => {
  const { userName, email, amount, transactionId, orderId, date, failureReason } = data;

  const subject = "⚠️ Payment Failed — Action Required";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payment Failed</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f1f0;
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f1f0; padding: 40px 16px;">
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
              />
              <!-- Failed icon circle -->
              <h1 style="
                margin: 0 0 8px;
                color: #f59e0b;
                font-size: 26px;
                font-weight: 700;
                letter-spacing: -0.3px;
              ">Payment Failed</h1>

              <p style="
                margin: 0;
                color: rgba(255,255,255,0.82);
                font-size: 15px;
              ">Unfortunately, we were unable to process your payment.</p>
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
                We're sorry to inform you that your recent payment of
                <strong style="color:#b91c1c;">$${amount.toFixed(2)}</strong>
                to <strong style="color:#1a3faa;">Spandoek Print</strong> could not be completed.
                Please review the details below and try again.
              </p>

              <!-- ===== AMOUNT HIGHLIGHT ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
                border-radius: 12px;
                margin-bottom: 28px;
                border: 1px solid #fecaca;
              ">
                <tr>
                  <td style="padding: 22px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 13px; color: #9b5555; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Amount Due</p>
                    <p style="margin: 0; font-size: 38px; font-weight: 800; color: #b91c1c; letter-spacing: -1px;">$${amount.toFixed(2)}</p>
                  </td>
                </tr>
              </table>

              <!-- ===== FAILURE REASON BOX ===== -->
              ${failureReason ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #fff8f0;
                border: 1px solid #fbd38d;
                border-left: 4px solid #f59e0b;
                border-radius: 10px;
                margin-bottom: 28px;
              ">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.8px;">Reason for Failure</p>
                    <p style="margin: 0; font-size: 14px; color: #78350f;">${failureReason}</p>
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
              ">Transaction Details</p>

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
                          background: #fee2e2;
                          border: 1px solid #fca5a5;
                          border-radius: 99px;
                          padding: 6px 16px;
                        ">
                          <span style="font-size: 13px; color: #991b1b; font-weight: 700;">● Payment Status: Failed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ===== WHAT TO DO NEXT ===== -->
              <p style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">What You Can Do</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #f8f9fc;
                border: 1px solid #e8ecf5;
                border-radius: 10px;
                margin-bottom: 32px;
              ">
                <tr>
                  <td style="padding: 18px 20px;">
                    <!-- Step 1 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px; width: 100%;">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <div style="
                            width: 22px;
                            height: 22px;
                            background: #1a3faa;
                            border-radius: 50%;
                            color: #fff;
                            font-size: 11px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 22px;
                          ">1</div>
                        </td>
                        <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5; vertical-align: top;">
                          <strong>Check your payment details</strong> — Make sure your card number, expiry date, and CVV are entered correctly.
                        </td>
                      </tr>
                    </table>
                    <!-- Step 2 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px; width: 100%;">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <div style="
                            width: 22px;
                            height: 22px;
                            background: #1a3faa;
                            border-radius: 50%;
                            color: #fff;
                            font-size: 11px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 22px;
                          ">2</div>
                        </td>
                        <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5; vertical-align: top;">
                          <strong>Ensure sufficient funds</strong> — Confirm your account has enough balance to complete this transaction.
                        </td>
                      </tr>
                    </table>
                    <!-- Step 3 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">
                          <div style="
                            width: 22px;
                            height: 22px;
                            background: #1a3faa;
                            border-radius: 50%;
                            color: #fff;
                            font-size: 11px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 22px;
                          ">3</div>
                        </td>
                        <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.5; vertical-align: top;">
                          <strong>Try a different payment method</strong> — Use another card or an alternative payment option.
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
                      href="https://your-frontend-url.com/checkout"
                      style="
                        display: inline-block;
                        background: linear-gradient(135deg, #b91c1c, #ef4444);
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 15px;
                        font-weight: 700;
                        padding: 14px 36px;
                        border-radius: 10px;
                        letter-spacing: 0.3px;
                        box-shadow: 0 4px 14px rgba(185,28,28,0.35);
                      "
                    >
                      Retry Payment →
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
                      💬 <strong>Still having trouble?</strong> Our support team is ready to help you resolve this quickly.
                      Reply to this email or visit our
                      <a href="https://your-frontend-url.com/support" style="color: #1a3faa; font-weight: 600;">Help Center</a>.
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
                This email was sent to <strong>${email}</strong> because a payment attempt was made on your account.<br/>
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