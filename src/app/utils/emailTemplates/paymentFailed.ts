import sendEmail from "./nodemailerTransport";

interface PaymentCancelData {
  userName: string;
  email: string;
  amount: number;
  transactionId?: string;
  orderId?: string;
  reason?: string;
}
export const paymentFailedTemplate = async (data: PaymentCancelData) => {
  const { userName, email, amount, transactionId, orderId, reason } = data;

  const subject = "❌ Payment Failed";

  const html = `
  <div style="font-family: Arial; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#fff; padding:30px; border-radius:8px;">
      
      <h2 style="color:#dc3545; text-align:center;">❌ Payment Failed</h2>

      <p>Hello <strong>${userName}</strong>,</p>

      <p>
        Your payment attempt was unsuccessful. This could be due to insufficient balance, incorrect card details, or bank rejection.
      </p>

      <table width="100%" style="margin-top:20px; border-collapse: collapse;">
        <tr>
          <td style="border:1px solid #eee; padding:10px;"><strong>Amount</strong></td>
          <td style="border:1px solid #eee; padding:10px;">$${amount}</td>
        </tr>
        ${
          transactionId
            ? `<tr>
                <td style="border:1px solid #eee; padding:10px;"><strong>Transaction ID</strong></td>
                <td style="border:1px solid #eee; padding:10px;">${transactionId}</td>
              </tr>`
            : ""
        }
        ${
          orderId
            ? `<tr>
                <td style="border:1px solid #eee; padding:10px;"><strong>Order ID</strong></td>
                <td style="border:1px solid #eee; padding:10px;">${orderId}</td>
              </tr>`
            : ""
        }
        ${
          reason
            ? `<tr>
                <td style="border:1px solid #eee; padding:10px;"><strong>Reason</strong></td>
                <td style="border:1px solid #eee; padding:10px;">${reason}</td>
              </tr>`
            : ""
        }
      </table>

      <div style="text-align:center; margin-top:25px;">
        <a href="https://your-frontend-url.com/checkout"
          style="background:#225ce4; color:#fff; padding:12px 25px; text-decoration:none; border-radius:5px;">
          Try Again
        </a>
      </div>

      <p style="margin-top:20px; font-size:14px; color:#555;">
        Please verify your payment details and try again.
      </p>

      <p style="text-align:center; color:#999;">— Your Team</p>
    </div>
  </div>
  `;

  await sendEmail(email, subject, html);
};