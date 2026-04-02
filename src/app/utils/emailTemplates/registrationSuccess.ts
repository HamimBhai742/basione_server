import sendEmail from "./nodemailerTransport";

interface RegistrationSuccessData {
  userName: string;
  email: string;
  registeredAt: string;
  avatarUrl?: string;
}

export const registrationSuccessTemplate = async (data: RegistrationSuccessData) => {
  const { userName, email, registeredAt, avatarUrl } = data;

  const subject = "🎉 Welcome to Spandoek Print — Account Successfully Created!";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Registration Successful</title>
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
              background: linear-gradient(135deg, #1a3faa 0%, #2d63e2 60%, #3b82f6 100%);
              padding: 44px 40px 40px;
              text-align: center;
            ">
              <img
                src="https://i.ibb.co.com/bjqdZXJm/spandoek-print-logo.png"
                width="300"
                alt="Spandoek Print"
                style="display:block; margin: 0 auto 24px; border-radius: 8px;"
              />

              <!-- Avatar or default icon -->
              ${avatarUrl
                ? `<img src="${avatarUrl}" width="80" height="80" alt="${userName}" style="
                    display: block;
                    margin: 0 auto 16px;
                    border-radius: 50%;
                    border: 3px solid rgba(255,255,255,0.5);
                    object-fit: cover;
                  "/>`
                : `<div style="
                    display: inline-block;
                    background: rgba(255,255,255,0.15);
                    border: 3px solid rgba(255,255,255,0.4);
                    border-radius: 50%;
                    width: 76px;
                    height: 76px;
                    line-height: 76px;
                    text-align: center;
                    font-size: 34px;
                    margin-bottom: 16px;
                  ">🎉</div>`
              }

              <h1 style="
                margin: 0 0 8px;
                color: #ffffff;
                font-size: 27px;
                font-weight: 700;
                letter-spacing: -0.3px;
              ">Welcome to Spandoek Print!</h1>

              <p style="
                margin: 0;
                color: rgba(255,255,255,0.82);
                font-size: 15px;
                line-height: 1.65;
              ">
                Your account is verified and ready to go.<br/>
                We're thrilled to have you with us!
              </p>
            </td>
          </tr>

          <!-- ===== BODY ===== -->
          <tr>
            <td style="padding: 36px 40px 0;">

              <!-- Greeting -->
              <p style="margin: 0 0 8px; font-size: 17px; color: #1a1a2e; font-weight: 700;">
                Hello, ${userName}! 👋
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; color: #555e7a; line-height: 1.75;">
                Congratulations! Your <strong style="color:#1a3faa;">Spandoek Print</strong> account has been
                <strong style="color:#059669;">successfully created and verified</strong>.
                You now have full access to all of our printing services. Let's get started!
              </p>

              <!-- ===== ACCOUNT INFO CARD ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
                border: 1px solid #c7d7fd;
                border-radius: 14px;
                margin-bottom: 28px;
              ">
                <tr>
                  <td style="padding: 22px 26px;">
                    <p style="margin: 0 0 14px; font-size: 12px; color: #6b7a9f; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700;">🪪 Your Account Details</p>

                    <!-- Name -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px;">
                      <tr>
                        <td style="width: 120px; font-size: 13px; color: #6b7a9f; font-weight: 600;">Full Name</td>
                        <td style="font-size: 13.5px; color: #1a1a2e; font-weight: 700;">${userName}</td>
                      </tr>
                    </table>

                    <!-- Email -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 10px;">
                      <tr>
                        <td style="width: 120px; font-size: 13px; color: #6b7a9f; font-weight: 600;">Email Address</td>
                        <td style="font-size: 13.5px; color: #1a1a2e; font-weight: 700;">${email}</td>
                      </tr>
                    </table>

                    <!-- Registered At -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
                      <tr>
                        <td style="width: 120px; font-size: 13px; color: #6b7a9f; font-weight: 600;">Member Since</td>
                        <td style="font-size: 13.5px; color: #1a1a2e; font-weight: 700;">${registeredAt}</td>
                      </tr>
                    </table>

                    <!-- Verified Badge -->
                    <div style="
                      display: inline-block;
                      background: #dcfce7;
                      border: 1px solid #86efac;
                      border-radius: 99px;
                      padding: 5px 16px;
                    ">
                      <span style="font-size: 13px; color: #15803d; font-weight: 700;">✔ Email Verified</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- ===== WHAT YOU CAN DO ===== -->
              <p style="
                margin: 0 0 14px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">Everything You Can Do Now</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <!-- Feature 1 -->
                  <td style="width: 50%; padding-right: 8px; vertical-align: top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #f8f9fc;
                      border: 1px solid #e8ecf5;
                      border-radius: 12px;
                      margin-bottom: 12px;
                    ">
                      <tr>
                        <td style="padding: 18px 16px;">
                          <p style="margin: 0 0 6px; font-size: 22px;">🖨️</p>
                          <p style="margin: 0 0 5px; font-size: 13.5px; font-weight: 700; color: #1a1a2e;">Order Prints</p>
                          <p style="margin: 0; font-size: 12.5px; color: #6b7a9f; line-height: 1.5;">Browse banners, stickers, flyers & more.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Feature 2 -->
                  <td style="width: 50%; padding-left: 8px; vertical-align: top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #f8f9fc;
                      border: 1px solid #e8ecf5;
                      border-radius: 12px;
                      margin-bottom: 12px;
                    ">
                      <tr>
                        <td style="padding: 18px 16px;">
                          <p style="margin: 0 0 6px; font-size: 22px;">📦</p>
                          <p style="margin: 0 0 5px; font-size: 13.5px; font-weight: 700; color: #1a1a2e;">Track Orders</p>
                          <p style="margin: 0; font-size: 12.5px; color: #6b7a9f; line-height: 1.5;">Monitor your order status in real time.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <!-- Feature 3 -->
                  <td style="width: 50%; padding-right: 8px; vertical-align: top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #f8f9fc;
                      border: 1px solid #e8ecf5;
                      border-radius: 12px;
                    ">
                      <tr>
                        <td style="padding: 18px 16px;">
                          <p style="margin: 0 0 6px; font-size: 22px;">🏷️</p>
                          <p style="margin: 0 0 5px; font-size: 13.5px; font-weight: 700; color: #1a1a2e;">Exclusive Deals</p>
                          <p style="margin: 0; font-size: 12.5px; color: #6b7a9f; line-height: 1.5;">Get member-only offers and discounts.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Feature 4 -->
                  <td style="width: 50%; padding-left: 8px; vertical-align: top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #f8f9fc;
                      border: 1px solid #e8ecf5;
                      border-radius: 12px;
                    ">
                      <tr>
                        <td style="padding: 18px 16px;">
                          <p style="margin: 0 0 6px; font-size: 22px;">⚡</p>
                          <p style="margin: 0 0 5px; font-size: 13.5px; font-weight: 700; color: #1a1a2e;">Fast Checkout</p>
                          <p style="margin: 0; font-size: 12.5px; color: #6b7a9f; line-height: 1.5;">Save your details for quicker orders.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ===== GET STARTED STEPS ===== -->
              <p style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">Get Started in 3 Easy Steps</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #f8f9fc;
                border: 1px solid #e8ecf5;
                border-radius: 12px;
                margin-bottom: 28px;
              ">
                <tr>
                  <td style="padding: 20px 22px;">

                    <!-- Step 1 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px;">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <div style="
                            width: 26px;
                            height: 26px;
                            background: linear-gradient(135deg, #1a3faa, #2d63e2);
                            border-radius: 50%;
                            color: #fff;
                            font-size: 12px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 26px;
                          ">1</div>
                        </td>
                        <td style="padding-left: 12px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
                          <strong>Complete your profile</strong> — Add your shipping address and preferences to your account settings.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 2 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 16px;">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <div style="
                            width: 26px;
                            height: 26px;
                            background: linear-gradient(135deg, #1a3faa, #2d63e2);
                            border-radius: 50%;
                            color: #fff;
                            font-size: 12px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 26px;
                          ">2</div>
                        </td>
                        <td style="padding-left: 12px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
                          <strong>Browse our product catalog</strong> — Explore banners, stickers, flyers, and custom print solutions.
                        </td>
                      </tr>
                    </table>

                    <!-- Step 3 -->
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <div style="
                            width: 26px;
                            height: 26px;
                            background: linear-gradient(135deg, #1a3faa, #2d63e2);
                            border-radius: 50%;
                            color: #fff;
                            font-size: 12px;
                            font-weight: 700;
                            text-align: center;
                            line-height: 26px;
                          ">3</div>
                        </td>
                        <td style="padding-left: 12px; font-size: 13.5px; color: #374151; line-height: 1.55; vertical-align: top;">
                          <strong>Place your first order</strong> — Upload your design, choose your specs, and we'll handle the rest!
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- ===== CTA BUTTONS ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a
                      href="https://your-frontend-url.com/dashboard"
                      style="
                        display: inline-block;
                        background: linear-gradient(135deg, #1a3faa, #2d63e2);
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 15px;
                        font-weight: 700;
                        padding: 14px 32px;
                        border-radius: 10px;
                        letter-spacing: 0.3px;
                        box-shadow: 0 4px 14px rgba(34,92,228,0.30);
                        margin-right: 10px;
                      "
                    >Go to Dashboard →</a>

                    <a
                      href="https://your-frontend-url.com/shop"
                      style="
                        display: inline-block;
                        background: #f3f4f6;
                        color: #374151;
                        text-decoration: none;
                        font-size: 15px;
                        font-weight: 700;
                        padding: 14px 32px;
                        border-radius: 10px;
                        letter-spacing: 0.3px;
                        border: 1px solid #d1d5db;
                      "
                    >Browse Products</a>
                  </td>
                </tr>
              </table>

              <!-- ===== DIVIDER ===== -->
              <hr style="border: none; border-top: 1px solid #e8ecf5; margin: 0 0 24px;" />

              <!-- ===== SUPPORT ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-radius: 10px;
                margin-bottom: 32px;
              ">
                <tr>
                  <td style="padding: 16px 18px;">
                    <p style="margin: 0; font-size: 13.5px; color: #78450f; line-height: 1.6;">
                      💬 <strong>Need help getting started?</strong> Our team is happy to assist you with anything.
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
                This welcome email was sent to <strong>${email}</strong> because you registered on Spandoek Print.<br/>
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