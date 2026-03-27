// import sendEmail from "./sendMailBrevo";

import sendEmail from "./nodemailerTransport";

export const passwordChangedTemplate = async (userName: string, subject: string, email: string, secureLink: string,) => {
    const html = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Changed</title>
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

        .warning-box {
            background-color: #f8f9fa;
            border-left: 4px solid #8b5cf6;
            padding: 16px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
            color: #5a6c7d;
        }

        .action-button {
            display: inline-block;
            margin-top: 16px;
            padding: 12px 24px;
            background-color: #8b5cf6;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
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
                        <p class="greeting">Hello ${userName},</p>

                        <p class="main-text">
                            This is a confirmation that your <strong>Hire Rise</strong> account password
                            was successfully changed.
                        </p>

                        <div class="warning-box">
                            If you made this change, no further action is required.
                            If you did <strong>not</strong> change your password, your account may be at risk.
                        </div>

                        <p class="main-text">
                            In that case, please secure your account immediately:
                        </p>

                        <a href="${secureLink}" class="action-button">
                            Secure My Account
                        </a>

                        <p class="main-text" style="margin-top: 20px;">
                            For your safety, we recommend enabling additional security measures
                            such as two-factor authentication.
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

</html>`;
    //   await sendEmail(email, subject, html);
    await sendEmail(email, subject, html)

}

