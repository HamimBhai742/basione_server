import sendEmail from "./nodemailerTransport";

interface PaymentSuccessData {
  userName: string;
  email: string;
  amount: number;
  transactionId: string;
  orderId: string;
  date: string;
}

export const paymentSuccessTemplate = async (data: PaymentSuccessData) => {
  const { userName, email, amount, transactionId, orderId, date } = data;

  const subject = "🎉 Payment Successful - Order Confirmed";

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
              <img src="http://api.hirerise.org/logo.png" width="100" alt="Logo"/>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="color:#28a745; margin:0;">✅ Payment Successful</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="color:#333; font-size:16px;">
              <p>Hello <strong>${userName}</strong>,</p>

              <p>
                Thank you for your purchase! Your payment has been successfully processed.
              </p>

              <p>
                Your order is now confirmed and being processed.
              </p>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding:20px 0;">
              <table width="100%" style="border-collapse: collapse;">
                <tr>
                  <td style="padding:10px; border:1px solid #eee;"><strong>Amount</strong></td>
                  <td style="padding:10px; border:1px solid #eee;">$${amount}</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #eee;"><strong>Transaction ID</strong></td>
                  <td style="padding:10px; border:1px solid #eee;">${transactionId}</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #eee;"><strong>Order ID</strong></td>
                  <td style="padding:10px; border:1px solid #eee;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding:10px; border:1px solid #eee;"><strong>Date</strong></td>
                  <td style="padding:10px; border:1px solid #eee;">${date}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:20px 0;">
              <a href="https://your-frontend-url.com/dashboard" style="
                background:#225ce4;
                color:#ffffff;
                padding:12px 25px;
                text-decoration:none;
                border-radius:5px;
                font-size:14px;
                display:inline-block;
              ">
                View Your Order
              </a>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding-top:20px; font-size:14px; color:#555;">
              <p>
                If you have any questions, feel free to contact our support team.
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