import sendEmail from "./nodemailerTransport";

export const orderDeliveryCompleteTemplate = async (
  userName: string,
  email: string,
  subject: string,
  data: {
    orderNumber: string;
    deliveredDate: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      image?: string;
    }[];
    totalAmount: number;
    deliveryAddress: string;
    reviewLink?: string;
  },
) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Order Delivered</title>

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
  background-color: #2ecc71;
  color: #ffffff;
  padding: 20px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}

.banner {
  background-color: #eafaf1;
  border-left: 4px solid #2ecc71;
  padding: 15px 20px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #27ae60;
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
}

.product {
  display: flex;
  margin-bottom: 15px;
}

.product img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  margin-right: 15px;
  border-radius: 4px;
}

.summary {
  border-top: 1px solid #ddd;
  padding-top: 10px;
  margin-top: 15px;
  font-size: 14px;
}

.total {
  font-size: 16px;
  font-weight: bold;
  margin-top: 10px;
}

.review-btn {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 25px;
  background-color: #f57224;
  color: #ffffff;
  text-decoration: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: bold;
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
    Order Delivered 📦✅
  </div>

  <div class="content">

    <div class="banner">
      Great news! Your order has been successfully delivered.
    </div>

    <p>Hello <strong>${userName}</strong>,</p>

    <p>
      We're happy to let you know that your order has been delivered to your address.
      We hope you enjoy your purchase!
    </p>

    <div class="order-box">
      <strong>Order Number:</strong> ${data.orderNumber} <br/>
      <strong>Delivered On:</strong> ${data.deliveredDate} <br/>
      <strong>Delivery Address:</strong> ${data.deliveryAddress}
    </div>

    <h3>Items Delivered</h3>

    ${data.items
      .map(
        (item) => `
      <div class="product">
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <div><strong>${item.name}</strong></div>
          <div>Quantity: ${item.quantity}</div>
          <div>Price: $${item.price}</div>
        </div>
      </div>
    `,
      )
      .join("")}

    <div class="summary">
      <div class="total">Order Total: $${data.totalAmount}</div>
    </div>

    ${
      data.reviewLink
        ? `
    <p style="margin-top:25px;">
      Enjoying your order? We'd love to hear from you!
    </p>
    <a href="${data.reviewLink}" class="review-btn">Leave a Review</a>
    `
        : ""
    }

    <p style="margin-top:25px;">
      If you have any issues with your order, please don't hesitate to reach out to our support team.
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