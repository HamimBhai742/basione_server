// import sendEmail from "./sendMailBrevo";

import sendEmail from './nodemailerTransport';

export const registrationOtpTemplate = async (
  userName: string,
  subject: string,
  email: string,
  otp: string,
) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .email-header {
      padding: 40px 40px 20px;
      text-align: center;
    }

    .company-logo img {
      width: 120px;
      height: auto;
    }

    .email-content {
      padding: 0 40px 30px;
    }

    .greeting {
      font-size: 16px;
      color: #2c3e50;
      margin-bottom: 16px;
      font-weight: 500;
    }

    .main-text {
      font-size: 16px;
      color: #5a6c7d;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .warning-text {
      font-size: 14px;
      color: #7f8c8d;
      margin-bottom: 24px;
    }

    .verification-section {
      text-align: center;
      padding: 24px 0;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin: 24px 0;
    }

    .verification-label {
      font-size: 16px;
      color: #2c3e50;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .verification-code {
      font-size: 36px;
      font-weight: 700;
      color: #225ce4;
      letter-spacing: 3px;
      font-family: 'Courier New', monospace;
    }

    .footer {
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #ecf0f1;
      color: #7f8c8d;
      font-size: 14px;
    }

    @media only screen and (max-width: 600px) {
      .email-header,
      .email-content,
      .footer {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }

      .verification-code {
        font-size: 28px;
        letter-spacing: 2px;
      }
    }
  </style>
</head>

<body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 20px 0;">
        <div class="email-container">
          <!-- Header -->
          <div class="email-header">
            <div class="company-logo">
              <img src="http://api.hirerise.org/logo.png" alt="Hire Rise" />
            </div>
          </div>

          <!-- Content -->
          <div class="email-content">
            <p class="greeting">Welcome ${userName},</p>

            <p class="main-text">
              Thank you for creating an account with <strong>Hire Rise</strong>.
              To complete your registration, please verify your email address using the code below.
            </p>

            <div class="verification-section">
              <p class="verification-label">Your registration code</p>
              <div class="verification-code">${otp}</div>
            </div>

            <p class="warning-text">
              This code will expire in 2 minutes.  
              If you didn’t create this account, you can safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            Regards,<br />
            Team <strong>Hire Rise</strong>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  //   await sendEmail(email, subject, html);
  await sendEmail(email, subject, html);
};
