import sendEmail from "./nodemailerTransport";

export const resetPasswordSuccessTemplate = async (
  userName: string,
  email: string
) => {
  const subject = "Your Password Has Been Reset Successfully";

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
              <img src="http://api.hirerise.org/logo.png" width="100" alt="Hire Rise"/>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="color:#28a745; margin:0;">✅ Password Reset Successful</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="color:#333; font-size:16px;">
              <p>Hello <strong>${userName}</strong>,</p>

              <p>
                Your password has been successfully reset for your 
                <strong>Hire Rise</strong> account.
              </p>

              <p>
                You can now log in using your new password.
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding:20px 0;">
              <div style="
                background:#fff3cd;
                color:#856404;
                padding:15px;
                border-radius:6px;
                font-size:14px;
              ">
                🔒 If you did NOT perform this action, please reset your password immediately or contact support.
              </div>
            </td>
          </tr>

          <!-- Optional Button -->
          <tr>
            <td align="center" style="padding:20px 0;">
              <a href="https://your-frontend-url.com/login" style="
                background:#225ce4;
                color:#ffffff;
                padding:12px 25px;
                text-decoration:none;
                border-radius:5px;
                font-size:14px;
                display:inline-block;
              ">
                Login Now
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:30px; text-align:center; font-size:14px; color:#999;">
              <p>Regards,<br/>Team <strong>Hire Rise</strong></p>
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