import sendEmail from "./nodemailerTransport";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface OrderConfirmedData {
  userName: string;
  email: string;
  orderId: string;
  orderDate: string;
  estimatedDelivery: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  shippingAddress: {
    address: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
}

export const orderConfirmedTemplate = async (data: OrderConfirmedData) => {
  const {
    userName,
    email,
    orderId,
    orderDate,
    estimatedDelivery,
    items,
    subtotal,
    shippingCost,
    discount = 0,
    total,
    shippingAddress,
    paymentMethod,
  } = data;

  const subject = `🎉 Order Confirmed — #${orderId} is Being Processed!`;

  const itemRows = items
    .map(
      (item, index) => `
    <tr>
      <td style="
        padding: 14px 18px;
        background: ${index % 2 === 0 ? "#f8f9fc" : "#ffffff"};
        border-bottom: 1px solid #e8ecf5;
        font-size: 13.5px;
        color: #1a1a2e;
        font-weight: 500;
      ">${item.name}</td>
      <td style="
        padding: 14px 18px;
        background: ${index % 2 === 0 ? "#f8f9fc" : "#ffffff"};
        border-bottom: 1px solid #e8ecf5;
        font-size: 13.5px;
        color: #6b7a9f;
        text-align: center;
      ">x${item.quantity}</td>
      <td style="
        padding: 14px 18px;
        background: ${index % 2 === 0 ? "#f8f9fc" : "#ffffff"};
        border-bottom: 1px solid #e8ecf5;
        font-size: 13.5px;
        color: #374151;
        font-weight: 600;
        text-align: right;
      ">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmed</title>
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
              padding: 40px 40px 32px;
              text-align: center;
            ">
              <img
                src="https://i.ibb.co.com/bjqdZXJm/spandoek-print-logo.png"
                width="300"
                alt="Spandoek Print"
                style="display:block; margin: 0 auto 24px; border-radius: 8px;"
              />

              <div style="
                display: inline-block;
                background: rgba(255,255,255,0.15);
                border: 3px solid rgba(255,255,255,0.4);
                border-radius: 50%;
                width: 72px;
                height: 72px;
                line-height: 72px;
                text-align: center;
                font-size: 32px;
                margin-bottom: 20px;
              ">🎉</div>

              <h1 style="
                margin: 0 0 8px;
                color: #ffffff;
                font-size: 26px;
                font-weight: 700;
                letter-spacing: -0.3px;
              ">Order Confirmed!</h1>

              <p style="
                margin: 0 0 18px;
                color: rgba(255,255,255,0.82);
                font-size: 15px;
              ">Thank you for your order. We're getting it ready for you!</p>

              <!-- Order ID pill -->
              <div style="
                display: inline-block;
                background: rgba(255,255,255,0.18);
                border: 1px solid rgba(255,255,255,0.35);
                border-radius: 99px;
                padding: 7px 22px;
                font-size: 13px;
                color: #ffffff;
                font-weight: 700;
                letter-spacing: 0.5px;
              ">Order #${orderId}</div>
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
                We've received your order and it's currently being processed by our team.
                You'll receive another email once your order has been shipped.
              </p>

              <!-- ===== ORDER META CARDS ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <!-- Order Date -->
                  <td style="width: 33.33%; padding-right: 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #f8f9fc;
                      border: 1px solid #e8ecf5;
                      border-radius: 10px;
                      text-align: center;
                    ">
                      <tr>
                        <td style="padding: 14px 10px;">
                          <p style="margin: 0 0 5px; font-size: 20px;">📅</p>
                          <p style="margin: 0 0 4px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Order Date</p>
                          <p style="margin: 0; font-size: 12.5px; font-weight: 700; color: #1a1a2e;">${orderDate}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Order Status -->
                  <td style="width: 33.33%; padding: 0 3px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #f0fdf4;
                      border: 1px solid #bbf7d0;
                      border-radius: 10px;
                      text-align: center;
                    ">
                      <tr>
                        <td style="padding: 14px 10px;">
                          <p style="margin: 0 0 5px; font-size: 20px;">⚙️</p>
                          <p style="margin: 0 0 4px; font-size: 11px; color: #15803d; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Status</p>
                          <p style="margin: 0; font-size: 12.5px; font-weight: 700; color: #166534;">Processing</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Estimated Delivery -->
                  <td style="width: 33.33%; padding-left: 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #fff7ed;
                      border: 1px solid #fed7aa;
                      border-radius: 10px;
                      text-align: center;
                    ">
                      <tr>
                        <td style="padding: 14px 10px;">
                          <p style="margin: 0 0 5px; font-size: 20px;">🚚</p>
                          <p style="margin: 0 0 4px; font-size: 11px; color: #c2410c; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Est. Delivery</p>
                          <p style="margin: 0; font-size: 12.5px; font-weight: 700; color: #9a3412;">${estimatedDelivery}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ===== ORDER ITEMS TABLE ===== -->
              <p style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">Order Summary</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                border-collapse: collapse;
                border-radius: 10px;
                overflow: hidden;
                border: 1px solid #e8ecf5;
                margin-bottom: 0;
              ">
                <!-- Table header -->
                <tr>
                  <td style="
                    padding: 11px 18px;
                    background: #1a3faa;
                    font-size: 12px;
                    color: rgba(255,255,255,0.75);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                  ">Item</td>
                  <td style="
                    padding: 11px 18px;
                    background: #1a3faa;
                    font-size: 12px;
                    color: rgba(255,255,255,0.75);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    text-align: center;
                  ">Qty</td>
                  <td style="
                    padding: 11px 18px;
                    background: #1a3faa;
                    font-size: 12px;
                    color: rgba(255,255,255,0.75);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    text-align: right;
                  ">Price</td>
                </tr>

                ${itemRows}

                <!-- Subtotal -->
                <tr>
                  <td colspan="2" style="
                    padding: 12px 18px;
                    background: #f8f9fc;
                    border-top: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #6b7a9f;
                  ">Subtotal</td>
                  <td style="
                    padding: 12px 18px;
                    background: #f8f9fc;
                    border-top: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #374151;
                    text-align: right;
                    font-weight: 600;
                  ">$${subtotal.toFixed(2)}</td>
                </tr>

                <!-- Shipping -->
                <tr>
                  <td colspan="2" style="
                    padding: 12px 18px;
                    background: #ffffff;
                    border-top: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #6b7a9f;
                  ">🚚 Shipping</td>
                  <td style="
                    padding: 12px 18px;
                    background: #ffffff;
                    border-top: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #374151;
                    text-align: right;
                    font-weight: 600;
                  ">${shippingCost === 0 ? '<span style="color:#16a34a;">FREE</span>' : `$${shippingCost.toFixed(2)}`}</td>
                </tr>

                <!-- Discount (conditional) -->
                ${
                  discount > 0
                    ? `
                <tr>
                  <td colspan="2" style="
                    padding: 12px 18px;
                    background: #f0fdf4;
                    border-top: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #16a34a;
                    font-weight: 600;
                  ">🏷️ Discount</td>
                  <td style="
                    padding: 12px 18px;
                    background: #f0fdf4;
                    border-top: 1px solid #e8ecf5;
                    font-size: 13px;
                    color: #16a34a;
                    text-align: right;
                    font-weight: 700;
                  ">- $${discount.toFixed(2)}</td>
                </tr>
                `
                    : ""
                }

                <!-- Grand Total -->
                <tr>
                  <td colspan="2" style="
                    padding: 15px 18px;
                    background: #1a3faa;
                    border-top: 2px solid #1a3faa;
                    font-size: 14px;
                    color: rgba(255,255,255,0.85);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  ">Grand Total</td>
                  <td style="
                    padding: 15px 18px;
                    background: #1a3faa;
                    border-top: 2px solid #1a3faa;
                    font-size: 18px;
                    color: #ffffff;
                    text-align: right;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                  ">$${total.toFixed(2)}</td>
                </tr>
              </table>

              <!-- ===== SHIPPING & PAYMENT INFO ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; margin-bottom: 28px;">
                <tr>
                  <!-- Shipping Address -->
                  <td style="width: 55%; padding-right: 10px; vertical-align: top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #f8f9fc;
                      border: 1px solid #e8ecf5;
                      border-radius: 10px;
                    ">
                      <tr>
                        <td style="padding: 16px 18px;">
                          <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">📦 Shipping Address</p>
                          <p style="margin: 0; font-size: 13.5px; color: #374151; line-height: 1.8;">
                            ${shippingAddress.address}<br/>
                            ${shippingAddress.country}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Payment Method -->
                  <td style="width: 45%; padding-left: 10px; vertical-align: top;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                      background: #f8f9fc;
                      border: 1px solid #e8ecf5;
                      border-radius: 10px;
                    ">
                      <tr>
                        <td style="padding: 16px 18px;">
                          <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">💳 Payment Method</p>
                          <p style="margin: 0; font-size: 13.5px; color: #374151; line-height: 1.8; font-weight: 600;">
                            ${paymentMethod}
                          </p>
                          <p style="margin: 6px 0 0; font-size: 12px; color: #16a34a; font-weight: 600;">✔ Payment Verified</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ===== ORDER PROGRESS TRACKER ===== -->
              <p style="
                margin: 0 0 14px;
                font-size: 13px;
                color: #6b7a9f;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 700;
              ">Order Progress</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <!-- Step 1: Confirmed (active) -->
                  <td style="text-align: center; width: 25%;">
                    <div style="
                      width: 36px;
                      height: 36px;
                      background: #1a3faa;
                      border-radius: 50%;
                      line-height: 36px;
                      text-align: center;
                      font-size: 16px;
                      margin: 0 auto 8px;
                      color: white;
                    ">✓</div>
                    <p style="margin: 0; font-size: 11.5px; font-weight: 700; color: #1a3faa;">Confirmed</p>
                  </td>
                  <!-- Connector -->
                  <td style="padding-bottom: 22px;">
                    <div style="height: 2px; background: linear-gradient(to right, #1a3faa, #d1d5db);"></div>
                  </td>
                  <!-- Step 2: Processing (active) -->
                  <td style="text-align: center; width: 25%;">
                    <div style="
                      width: 36px;
                      height: 36px;
                      background: #2d63e2;
                      border-radius: 50%;
                      line-height: 36px;
                      text-align: center;
                      font-size: 15px;
                      margin: 0 auto 8px;
                      color: white;
                    ">⚙</div>
                    <p style="margin: 0; font-size: 11.5px; font-weight: 700; color: #2d63e2;">Processing</p>
                  </td>
                  <!-- Connector -->
                  <td style="padding-bottom: 22px;">
                    <div style="height: 2px; background: #d1d5db;"></div>
                  </td>
                  <!-- Step 3: Shipped -->
                  <td style="text-align: center; width: 25%;">
                    <div style="
                      width: 36px;
                      height: 36px;
                      background: #e5e7eb;
                      border-radius: 50%;
                      line-height: 36px;
                      text-align: center;
                      font-size: 15px;
                      margin: 0 auto 8px;
                      color: #9ca3af;
                    ">🚚</div>
                    <p style="margin: 0; font-size: 11.5px; font-weight: 600; color: #9ca3af;">Shipped</p>
                  </td>
                  <!-- Connector -->
                  <td style="padding-bottom: 22px;">
                    <div style="height: 2px; background: #d1d5db;"></div>
                  </td>
                  <!-- Step 4: Delivered -->
                  <td style="text-align: center; width: 25%;">
                    <div style="
                      width: 36px;
                      height: 36px;
                      background: #e5e7eb;
                      border-radius: 50%;
                      line-height: 36px;
                      text-align: center;
                      font-size: 15px;
                      margin: 0 auto 8px;
                      color: #9ca3af;
                    ">🏠</div>
                    <p style="margin: 0; font-size: 11.5px; font-weight: 600; color: #9ca3af;">Delivered</p>
                  </td>
                </tr>
              </table>

              <!-- ===== CTA BUTTONS ===== -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="https://your-frontend-url.com/orders/${orderId}" style="
                      display: inline-block;
                      background: linear-gradient(135deg, #1a3faa, #2d63e2);
                      color: #ffffff;
                      text-decoration: none;
                      font-size: 15px;
                      font-weight: 700;
                      padding: 14px 32px;
                      border-radius: 10px;
                      letter-spacing: 0.3px;
                      box-shadow: 0 4px 14px rgba(34,92,228,0.3);
                      margin-right: 10px;
                    ">Track My Order →</a>

                    <a href="https://your-frontend-url.com/shop" style="
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
                    ">Continue Shopping</a>
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
                      💬 <strong>Need help with your order?</strong> Our support team is available to assist you.
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
              text-align: center;
              padding: 28px 40px;
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
                This email was sent to <strong>${email}</strong> to confirm your order on Spandoek Print.<br/>
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
