import sendEmail from "./nodemailerTransport";

interface ResetPasswordSuccessData {
  userName: string;
  email: string;
  resetAt: string;
  ipAddress?: string;
  device?: string;
  location?: string;
}

export const resetPasswordSuccessTemplate = async (
  data: ResetPasswordSuccessData,
) => {
  const { userName, email, resetAt, ipAddress, device, location } = data;

  const subject = "✅ Your Password Has Been Reset Successfully";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset Successful</title>
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

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="
          max-width: 600px;
          width: 100%;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        ">

          <!-- ===== HEADER ===== -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #064e3b 0%, #059669 60%, #34d399 100%);
              padding: 40px 40px 36px;
              text-align: center;
            ">
              <!-- Logo -->
              <img
                src="https://i.ibb.co.com/bjqdZXJm/spandoek-print-logo.png"
                width="300"
                alt="Spandoek Print"
                style="display:block; margin: 0 auto 24px; border-radius: 8px;"
              />

              <!-- Shield success icon circle -->
              <div style="
                display: inline-block;
                background: rgba(255,255,255,0.15);
                border: 3px solid rgba(255,255,255,0.40);
                border-radius: 50%;
                width: 76px;
                height: 76px;
                line-height: 76px;
                text-align: center;
                font-size: 34px;
                margin-bottom: 20px;
              ">🛡️</div>

              <h1 style="
                margin: 0 0 8px;
                color: #ffffff;
                font-size: 26px;
                font-weight: 700;
                letter-spacing: -0.3px;
              ">Password Reset Successful</h1>

              <p style="
                margin: 0;
                color: rgba(255,255,255,0.82);
                font-size: 15px;
                line-height: 1.6;
              ">
                Your password has been updated and your account is secured.
              </p>
            </td>
          </tr>

          <!-- ===== BODY ===== -->
          <tr>
            <td style="padding: 36px 40px 0;">

              <!-- Greeting -->
              <p style="margin: 0 0 8px; font-size: 16px; color: #1a1a2e; font-weight: 600;">
                Hello, ${userName} 👋
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; color: #555e7a; line-height: 1.75;">
                This is a confirmation that the password for your
                <strong style="color:#1a3faa;">Spandoek Print</strong> account associated with
                <strong style="color:#1a1a2e;">${email}</strong> has been
                <strong style="color:#059669;">successfully reset</strong>.
                You can now log in with your new password.
              </p>

              <!-- ===== SUCCESS BANNER ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 1px solid #86efac;
                border-radius: 14px;
                margin-bottom: 28px;
              ">
                <tr>
                  <td style="padding: 22px 24px; text-align: center;">
                    <p style="margin: 0 0 6px; font-size: 13px; color: #16a34a; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700;">Account Status</p>
                    <p style="margin: 0 0 10px; font-size: 24px; font-weight: 800; color: #15803d; letter-spacing: -0.5px;">🔒 Password Updated</p>
                    <div style="
                      display: inline-block;
                      background: #16a34a;
                      border-radius: 99px;
                      padding: 5px 18px;
                    ">
                      <span style="font-size: 13px; color: #ffffff; font-weight: 700;">● Your Account Is Secured</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- ===== RESET DETAILS ===== -->
              <p style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">Reset Details</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                border-collapse: collapse;
                border-radius: 10px;
                overflow: hidden;
                border: 1px solid #e8ecf5;
                margin-bottom: 28px;
              ">
                <!-- Reset At -->
                <tr>
                  <td style="
                    padding: 13px 18px;
                    background: #f8f9fc;
                    border-bottom: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #6b7a9f;
                    font-weight: 600;
                    width: 38%;
                  ">🕐 Date & Time</td>
                  <td style="
                    padding: 13px 18px;
                    background: #f8f9fc;
                    border-bottom: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #1a1a2e;
                    font-weight: 500;
                  ">${resetAt}</td>
                </tr>

                <!-- Device (conditional) -->
                ${
                  device
                    ? `
                <tr>
                  <td style="
                    padding: 13px 18px;
                    background: #ffffff;
                    border-bottom: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #6b7a9f;
                    font-weight: 600;
                  ">💻 Device</td>
                  <td style="
                    padding: 13px 18px;
                    background: #ffffff;
                    border-bottom: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #1a1a2e;
                    font-weight: 500;
                  ">${device}</td>
                </tr>
                `
                    : ""
                }

                <!-- Location (conditional) -->
                ${
                  location
                    ? `
                <tr>
                  <td style="
                    padding: 13px 18px;
                    background: ${ipAddress ? "#f8f9fc" : "#ffffff"};
                    border-bottom: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #6b7a9f;
                    font-weight: 600;
                  ">📍 Location</td>
                  <td style="
                    padding: 13px 18px;
                    background: ${ipAddress ? "#f8f9fc" : "#ffffff"};
                    border-bottom: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #1a1a2e;
                    font-weight: 500;
                  ">${location}</td>
                </tr>
                `
                    : ""
                }

                <!-- IP Address (conditional) -->
                ${
                  ipAddress
                    ? `
                <tr>
                  <td style="
                    padding: 13px 18px;
                    background: #ffffff;
                    font-size: 13px;
                    color: #6b7a9f;
                    font-weight: 600;
                  ">🌐 IP Address</td>
                  <td style="
                    padding: 13px 18px;
                    background: #ffffff;
                    font-size: 13px;
                    color: #1a1a2e;
                    font-weight: 500;
                    font-family: 'Courier New', monospace;
                  ">${ipAddress}</td>
                </tr>
                `
                    : ""
                }
              </table>

              <!-- ===== WHAT'S NEXT ===== -->
              <p style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">What's Next?</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #f8f9fc;
                border: 1px solid #e8ecf5;
                border-radius: 12px;
                margin-bottom: 28px;
              ">
                <tr>
                  <td style="padding: 18px 20px;">

                    <!-- Step 1 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 14px;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <div style="
                            width: 24px;
                            height: 24px;
                            background: #059669;
                            border-radius: 50%;
                            color: #fff;
                            font-size: 12px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 24px;
                          ">1</div>
                        </td>
                        <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
                          <strong>Log in with your new password</strong> — Visit the login page and sign in using your updated credentials.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 2 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 14px;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <div style="
                            width: 24px;
                            height: 24px;
                            background: #059669;
                            border-radius: 50%;
                            color: #fff;
                            font-size: 12px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 24px;
                          ">2</div>
                        </td>
                        <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
                          <strong>Use a strong, unique password</strong> — Avoid reusing old passwords across different websites.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 3 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <div style="
                            width: 24px;
                            height: 24px;
                            background: #059669;
                            border-radius: 50%;
                            color: #fff;
                            font-size: 12px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 24px;
                          ">3</div>
                        </td>
                        <td style="padding-left: 10px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
                          <strong>Log out of all other devices</strong> — If you suspect any unauthorized access, log out of all sessions immediately from your account settings.
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
                      href="https://your-frontend-url.com/login"
                      style="
                        display: inline-block;
                        background: linear-gradient(135deg, #059669, #10b981);
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 15px;
                        font-weight: 700;
                        padding: 14px 40px;
                        border-radius: 10px;
                        letter-spacing: 0.3px;
                        box-shadow: 0 4px 14px rgba(5,150,105,0.32);
                      "
                    >
                      Log In to Your Account →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- ===== DIVIDER ===== -->
              <hr style="border: none; border-top: 1px solid #e8ecf5; margin: 0 0 24px;" />

              <!-- ===== SECURITY ALERT ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #fff5f5;
                border: 1px solid #fecaca;
                border-left: 4px solid #ef4444;
                border-radius: 10px;
                margin-bottom: 32px;
              ">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0 0 5px; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.8px;">⚠️ Wasn't You?</p>
                    <p style="margin: 0; font-size: 13.5px; color: #7f1d1d; line-height: 1.6;">
                      If you did <strong>not</strong> reset your password, your account may be at risk.
                      Please <a href="https://your-frontend-url.com/support" style="color: #1a3faa; font-weight: 600;">contact our support team</a> immediately
                      and secure your account by resetting your password again.
                    </p>
                  </td>
                </tr>
              </table>

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
                      💬 <strong>Need help?</strong> If you're having trouble logging in or have any concerns about your account security,
                      <a href="https://your-frontend-url.com/support" style="color: #1a3faa; font-weight: 600;">visit our Help Center</a> or reply to this email.
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
                This security notification was sent to <strong>${email}</strong> because a password reset was completed on your account.<br/>
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

  await sendEmail(email, subject, html);
};
