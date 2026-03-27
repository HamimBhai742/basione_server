// import sendEmail from "./sendMailBrevo";

import sendEmail from "./nodemailerTransport";

export const parentApprovalOtpTemplate = async (userName: string, subject: string, email: string, otp: string,) => {
    const html = `
    <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Parent Approval Required</title>

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
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            padding: 40px;
            text-align: center;
        }

        .header img {
            width: 120px;
        }

        .content {
            padding: 0 40px 30px;
        }

        .text {
            font-size: 16px;
            color: #5a6c7d;
            line-height: 1.6;
            margin-bottom: 18px;
        }

        .otp-box {
            background-color: #eef4ff;
            border-radius: 8px;
            text-align: center;
            padding: 30px 0;
            margin: 25px 0;
        }

        .otp-label {
            font-size: 14px;
            color: #7f8c8d;
            margin-bottom: 10px;
        }

        .otp-code {
            font-size: 38px;
            font-weight: 700;
            color: #8b5cf6;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
        }

        .note {
            font-size: 13px;
            color: #7f8c8d;
            margin-top: 20px;
        }

        .footer {
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #ecf0f1;
            font-size: 14px;
            color: #7f8c8d;
        }

        @media only screen and (max-width: 600px) {

            .header,
            .content,
            .footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }

            .otp-code {
                font-size: 28px;
                letter-spacing: 2px;
            }
        }
    </style>
</head>

<body>
    <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td style="padding: 20px 0;">
                <div class="email-container">

                    <!-- Header -->
                    <div class="header">
                        <img src="http://api.hirerise.org/logo.png" alt="Hire Rise" />
                    </div>

                    <!-- Content -->
                    <div class="content">

                        <p class="text">Hello parent,</p>

                        <p class="text">
                            A child name ${userName} account has requested to register using your email address
                            on <strong>Hire Rise</strong>.
                            To approve this request, please use the verification code below.
                        </p>

                        <!-- OTP -->
                        <div class="otp-box">
                            <div class="otp-label">Parent approval code</div>
                            <div class="otp-code">${otp}</div>
                        </div>

                        <p class="note">
                            • This code expires in <strong>5 minutes</strong><br />
                            • Enter this code in the app to approve the account<br />
                            • If you didn’t request this, you can safely ignore this email
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

