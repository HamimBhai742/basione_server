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
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bestelling geleverd</title>

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
 Bestelling geleverd 
 </div>

 <div class="content">

 <div class="banner">
 Goed nieuws! Uw bestelling is succesvol geleverd.
 </div>

 <p>Hallo <strong>${userName}</strong>,</p>

 <p>
 We laten u graag weten dat uw bestelling op uw adres is geleverd.
 We hopen dat u tevreden bent met uw aankoop!
 </p>

 <div class="order-box">
 <strong>Bestelnummer:</strong> ${data.orderNumber} <br/>
 <strong>Geleverd op:</strong> ${data.deliveredDate} <br/>
 <strong>Bezorgadres:</strong> ${data.deliveryAddress}
 </div>

 <h3>Geleverde items</h3>

 ${data.items
 .map(
 (item) => `
 <div class="product">
 <img src="${item.image}" alt="${item.name}" />
 <div>
 <div><strong>${item.name}</strong></div>
 <div>Aantal: ${item.quantity}</div>
 <div>Prijs: EUR ${item.price}</div>
 </div>
 </div>
 `,
 )
 .join("")}

 <div class="summary">
 <div class="total">Besteltotaal: EUR ${data.totalAmount}</div>
 </div>

 ${
 data.reviewLink
 ? `
 <p style="margin-top:25px;">
 Bent u tevreden met uw bestelling? We horen graag van u!
 </p>
 <a href="${data.reviewLink}" class="review-btn">Laat een review achter</a>
 `
 : ""
 }

 <p style="margin-top:25px;">
 Als er problemen zijn met uw bestelling, neem dan gerust contact op met onze klantenservice.
 </p>

 </div>

 <div class="footer">
 Hulp nodig? Neem op elk moment contact op met onze klantenservice.<br/>
 ${new Date().getFullYear()} Spandoek Print. Alle rechten voorbehouden.
 </div>

</div>

</body>
</html>
`;

 await sendEmail(email, subject, html);
};
