import sendEmail from "./nodemailerTransport";

export const orderRefundedTemplate = async (
 userName: string,
 email: string,
 subject: string,
 data: {
 orderNumber: string;
 refundDate: string;
 refundAmount: number;
 refundMethod: string;
 refundReason?: string;
 items: {
 name: string;
 quantity: number;
 price: number;
 image?: string;
 }[];
 estimatedArrival?: string;
 supportLink?: string;
 },
) => {
 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bestelling terugbetaald</title>

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
 background-color: #3498db;
 color: #ffffff;
 padding: 20px;
 text-align: center;
 font-size: 20px;
 font-weight: bold;
}

.banner {
 background-color: #ebf5fb;
 border-left: 4px solid #3498db;
 padding: 15px 20px;
 margin-bottom: 20px;
 font-size: 14px;
 color: #2980b9;
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

.refund-box {
 background: #ebf5fb;
 border: 1px solid #aed6f1;
 padding: 15px;
 border-radius: 5px;
 margin-bottom: 20px;
 font-size: 14px;
}

.refund-amount {
 font-size: 22px;
 font-weight: bold;
 color: #2980b9;
 margin: 8px 0;
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

.timeline {
 display: flex;
 align-items: flex-start;
 gap: 12px;
 margin: 20px 0;
 font-size: 13px;
 color: #555;
}

.timeline-dot {
 width: 12px;
 height: 12px;
 min-width: 12px;
 border-radius: 50%;
 background-color: #3498db;
 margin-top: 3px;
}

.support-btn {
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

.divider {
 border: none;
 border-top: 1px solid #ddd;
 margin: 20px 0;
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
 Restitutie verwerkt 
 </div>

 <div class="content">

 <div class="banner">
 Uw restitutie is succesvol gestart.
 </div>

 <p>Hallo <strong>${userName}</strong>,</p>

 <p>
 We hebben een restitutie verwerkt voor uw recente bestelling. Bekijk de gegevens hieronder.
 </p>

 <div class="order-box">
 <strong>Bestelnummer:</strong> ${data.orderNumber} <br/>
 <strong>Restitutiedatum:</strong> ${data.refundDate} <br/>
 ${data.refundReason ? `<strong>Reden:</strong> ${data.refundReason}` : ""}
 </div>

 <div class="refund-box">
 <div>Restitutiebedrag</div>
 <div class="refund-amount">EUR ${data.refundAmount}</div>
 <div><strong>Restitutiemethode:</strong> ${data.refundMethod}</div>
 ${
 data.estimatedArrival
 ? `<div style="margin-top:8px; font-size:13px; color:#555;">
 Naar verwachting ontvangen op <strong>${data.estimatedArrival}</strong>
 </div>`
 : ""
 }
 </div>

 <h3>Terugbetaalde items</h3>

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

 <hr class="divider" />

 <div class="timeline">
 <div class="timeline-dot"></div>
 <div>
 <strong>Wat gebeurt er nu?</strong><br/>
 De restitutie wordt teruggestort via uw oorspronkelijke betaalmethode.
 De verwerkingstijd kan verschillen per bank of betaalprovider
 (meestal 3-7 werkdagen).
 </div>
 </div>

 ${
 data.supportLink
 ? `
 <p style="margin-top:15px; font-size:14px;">
 Hebt u nog vragen over uw restitutie?
 </p>
 <a href="${data.supportLink}" class="support-btn">Neem contact op met support</a>
 `
 : ""
 }

 <p style="margin-top:25px;">
 Onze excuses voor het ongemak. We hopen u snel weer van dienst te zijn.
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
