import sendEmail from "./nodemailerTransport";

interface PaymentCancelData {
  userName: string;
  email: string;
  amount: number;
  transactionId?: string;
  orderId?: string;
  reason?: string;
}

export const paymentCancelTemplate = async (data: PaymentCancelData) => {
  const { userName, email, amount, transactionId, orderId, reason } = data;

  const subject = "❌ Payment Failed or Cancelled";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>

<body style="margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <table width="600" style="background:#ffffff; border-radius:8px; padding:30px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <img src="https://i.ibb.co.com/k6rKTqjh/Screenshot-242-removebg-preview.png" width="100" alt="Logo"/>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="color:#dc3545; margin:0;">❌ Payment Cancelled</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="color:#333; font-size:16px;">
              <p>Hello <strong>${userName}</strong>,</p>

              <p>
                Unfortunately, your recent payment could not be completed or was cancelled.
              </p>

              <p>
                Please try again to complete your order.
              </p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:20px 0;">
              <table width="100%" style="border-collapse: collapse;">
                <tr>
                  <td style="padding:10px; border:1px solid #eee;"><strong>Amount</strong></td>
                  <td style="padding:10px; border:1px solid #eee;">$${amount}</td>
                </tr>
                ${
                  transactionId
                    ? `
                <tr>
                  <td style="padding:10px; border:1px solid #eee;"><strong>Transaction ID</strong></td>
                  <td style="padding:10px; border:1px solid #eee;">${transactionId}</td>
                </tr>`
                    : ""
                }
                ${
                  orderId
                    ? `
                <tr>
                  <td style="padding:10px; border:1px solid #eee;"><strong>Order ID</strong></td>
                  <td style="padding:10px; border:1px solid #eee;">${orderId}</td>
                </tr>`
                    : ""
                }
                ${
                  reason
                    ? `
                <tr>
                  <td style="padding:10px; border:1px solid #eee;"><strong>Reason</strong></td>
                  <td style="padding:10px; border:1px solid #eee;">${reason}</td>
                </tr>`
                    : ""
                }
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:20px 0;">
              <a href="https://your-frontend-url.com/checkout" style="
                background:#225ce4;
                color:#ffffff;
                padding:12px 25px;
                text-decoration:none;
                border-radius:5px;
                font-size:14px;
                display:inline-block;
              ">
                Try Payment Again
              </a>
            </td>
          </tr>

          <!-- Help -->
          <tr>
            <td style="padding-top:20px; font-size:14px; color:#555;">
              <p>
                If the issue persists, please contact our support team for assistance.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:30px; text-align:center; font-size:14px; color:#999;">
              <p>Regards,<br/>Team <strong>Your Brand</strong></p>
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