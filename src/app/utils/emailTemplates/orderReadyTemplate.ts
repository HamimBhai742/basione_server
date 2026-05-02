import sendEmail from "./nodemailerTransport";

export const orderReadyTemplate = async (
  userName: string,
  email: string,
  subject: string,
  data: {
    orderNumber: string;
    readyDate: string;
    pickupDeadline?: string;
    pickupAddress?: string;
    pickupCode?: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      image?: string;
    }[];
    totalAmount: number;
    paymentMethod: string;
    trackingLink?: string;
    supportLink?: string;
  },
) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Order Ready</title>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.container {
  max-width: 650px;
  margin: 20px auto;
  background: #ffffff;
  border-radius: 6px;
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #f57224 0%, #e65c00 100%);
  color: #ffffff;
  padding: 28px 20px;
  text-align: center;
}

.header-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 4px;
}

.header-sub {
  font-size: 13px;
  opacity: 0.9;
}

.banner {
  background-color: #fff8f3;
  border-left: 4px solid #f57224;
  padding: 15px 20px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #e65c00;
  font-weight: bold;
}

.content {
  padding: 25px 30px;
  color: #333;
}

.order-box {
  background: #fafafa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.8;
}

.pickup-box {
  background: #fff3e0;
  border: 1px solid #f5c28a;
  border-radius: 5px;
  padding: 18px;
  margin-bottom: 20px;
  text-align: center;
}

.pickup-box h3 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pickup-code {
  font-size: 32px;
  font-weight: bold;
  color: #e65c00;
  letter-spacing: 6px;
  margin: 8px 0;
}

.pickup-hint {
  font-size: 12px;
  color: #777;
  margin-top: 6px;
}

.product {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
}

.product img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  margin-right: 15px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.product-meta {
  font-size: 13px;
  color: #666;
}

.summary {
  border-top: 1px solid #ddd;
  padding-top: 12px;
  margin-top: 10px;
  font-size: 14px;
}

.total {
  font-size: 17px;
  font-weight: bold;
  color: #333;
  margin-top: 8px;
}

.steps {
  margin: 20px 0;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
  font-size: 14px;
  color: #444;
}

.step-number {
  min-width: 26px;
  height: 26px;
  width: 26px;
  border-radius: 50%;
  background-color: #f57224;
  color: #fff;
  font-weight: bold;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.deadline-box {
  background: #fef9e7;
  border: 1px solid #f9e79f;
  border-radius: 5px;
  padding: 12px 15px;
  font-size: 13px;
  color: #7d6608;
  margin-bottom: 20px;
}

.cta-btn {
  display: inline-block;
  margin-top: 8px;
  padding: 12px 28px;
  background-color: #f57224;
  color: #ffffff;
  text-decoration: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: bold;
}

.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 22px 0;
}

.footer {
  background: #fafafa;
  text-align: center;
  padding: 15px;
  font-size: 12px;
  color: #777;
}
</style>
</head>

<body>

<div class="container">

  <div class="header">
    <div class="header-title">Your Order Is Ready! 🎉</div>
    <div class="header-sub">Packed and waiting just for you</div>
  </div>

  <div class="content">

    <div class="banner">
      ✅ Your order #${data.orderNumber} is ready for pickup / dispatch.
    </div>

    <p>Hello <strong>${userName}</strong>,</p>

    <p>
      Exciting news — your order has been carefully packed and is now ready!
      Please review the details below.
    </p>

    <div class="order-box">
      <strong>Order Number:</strong> ${data.orderNumber} <br/>
      <strong>Ready Date:</strong> ${data.readyDate} <br/>
      <strong>Payment Method:</strong> ${data.paymentMethod}
      ${data.pickupAddress ? `<br/><strong>Pickup Address:</strong> ${data.pickupAddress}` : ""}
    </div>

    ${
      data.pickupCode
        ? `
    <div class="pickup-box">
      <h3>Your Pickup Code</h3>
      <div class="pickup-code">${data.pickupCode}</div>
      <div class="pickup-hint">Show this code at the counter when collecting your order.</div>
    </div>
    `
        : ""
    }

    ${
      data.pickupDeadline
        ? `
    <div class="deadline-box">
      ⏰ <strong>Important:</strong> Please collect your order by <strong>${data.pickupDeadline}</strong>.
      Orders not collected by this date may be cancelled automatically.
    </div>
    `
        : ""
    }

    <h3>Items in Your Order</h3>

    ${data.items
      .map(
        (item) => `
      <div class="product">
        <img src="${item.image}" alt="${item.name}" />
        <div class="product-info">
          <div class="product-name">${item.name}</div>
          <div class="product-meta">Quantity: ${item.quantity}</div>
          <div class="product-meta">Price: €${item.price}</div>
        </div>
      </div>
    `,
      )
      .join("")}

    <div class="summary">
      <div class="total">Order Total: €${data.totalAmount}</div>
    </div>

    <hr class="divider" />

    <h3>What To Do Next</h3>
    <ul class="steps">
      <li class="step">
        <div class="step-number">1</div>
        <div>Head to our store or wait for our delivery team to dispatch your package.</div>
      </li>
      <li class="step">
        <div class="step-number">2</div>
        <div>${data.pickupCode ? `Show your pickup code <strong>${data.pickupCode}</strong> at the counter.` : "Our team will contact you before delivery."}</div>
      </li>
      <li class="step">
        <div class="step-number">3</div>
        <div>Inspect your items upon receipt and enjoy your purchase!</div>
      </li>
    </ul>

    ${
      data.trackingLink
        ? `
    <p style="margin-top: 15px; font-size: 14px;">
      Want to track your order in real time?
    </p>
    <a href="${data.trackingLink}" class="cta-btn">Track My Order</a>
    `
        : ""
    }

    ${
      data.supportLink
        ? `
    <p style="margin-top: 20px; font-size: 13px; color: #777;">
      Have questions? <a href="${data.supportLink}" style="color: #f57224; font-weight: bold;">Contact our support team</a>.
    </p>
    `
        : ""
    }

    <p style="margin-top: 25px;">
      Thank you for shopping with us. We can't wait for you to enjoy your order!
    </p>

  </div>

  <div class="footer">
    Need help? Contact our support team anytime.<br/>
    © ${new Date().getFullYear()} Your Store Name. All rights reserved.
  </div>

</div>

</body>
</html>
`;

  await sendEmail(email, subject, html);
};