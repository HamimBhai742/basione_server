import sendEmail from "./nodemailerTransport";

export const orderConfirmationTemplate = async (
  userName: string,
  email: string,
  subject: string,
  data: {
    orderNumber: string;
    orderDate: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      image: string;
    }[];
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
    deliveryAddress: string;
    paymentMethod: string;
  }
) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Order Confirmation</title>

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
  background-color: #f57224;
  color: #ffffff;
  padding: 20px;
  text-align: center;
  font-size: 20px;
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
    Order Confirmed ✔
  </div>

  <div class="content">

    <p>Hello <strong>${userName}</strong>,</p>

    <p>
      Thank you for shopping with us! Your order has been successfully placed.
    </p>

    <div class="order-box">
      <strong>Order Number:</strong> ${data.orderNumber} <br/>
      <strong>Order Date:</strong> ${data.orderDate} <br/>
      <strong>Payment Method:</strong> ${data.paymentMethod}
    </div>

    <h3>Items Ordered</h3>

    ${data.items
      .map(
        (item) => `
      <div class="product">
        <img src="${item.image}" />
        <div>
          <div><strong>${item.name}</strong></div>
          <div>Quantity: ${item.quantity}</div>
          <div>Price: ৳${item.price}</div>
        </div>
      </div>
    `
      )
      .join("")}

    <div class="summary">
      <p>Subtotal: ৳${data.subtotal}</p>
      <p>Shipping Fee: ৳${data.shippingFee}</p>
      <div class="total">Total: ৳${data.totalAmount}</div>
    </div>

    <h3>Delivery Address</h3>
    <p>${data.deliveryAddress}</p>

    <p style="margin-top:20px;">
      You will receive another notification once your order has been shipped.
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
