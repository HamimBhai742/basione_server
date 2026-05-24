import sendEmail from "./nodemailerTransport";

export const orderShippedTemplate = async (
 userName: string,
 email: string,
 subject: string,
 data: {
 orderNumber: string;
 shippedDate: string;
 estimatedDelivery: string;
 courierName: string;
 trackingNumber: string;
 trackingLink?: string;
 items: {
 name: string;
 quantity: number;
 price: number;
 image?: string;
 }[];
 totalAmount: number;
 deliveryAddress: string;
 supportLink?: string;
 },
) => {
 const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bestelling verzonden</title>

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
 background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
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
 opacity: 0.88;
 margin-top: 4px;
}

.content {
 padding: 25px 30px;
 color: #333;
}

.banner {
 background-color: #e8f0fe;
 border-left: 4px solid #1a73e8;
 padding: 15px 20px;
 margin-bottom: 20px;
 font-size: 14px;
 color: #1558b0;
 font-weight: bold;
}

.order-box {
 background: #fafafa;
 padding: 15px;
 border-radius: 5px;
 margin-bottom: 20px;
 font-size: 14px;
 line-height: 1.9;
}

/* Tracking Card */
.tracking-card {
 border: 1px solid #c5d8fc;
 border-radius: 6px;
 overflow: hidden;
 margin-bottom: 22px;
}

.tracking-card-header {
 background-color: #1a73e8;
 color: #fff;
 padding: 10px 18px;
 font-size: 13px;
 font-weight: bold;
 letter-spacing: 0.5px;
 text-transform: uppercase;
}

.tracking-card-body {
 padding: 16px 18px;
 font-size: 14px;
 background: #f0f6ff;
}

.tracking-number {
 font-size: 24px;
 font-weight: bold;
 color: #1a73e8;
 letter-spacing: 3px;
 margin: 6px 0 10px;
}

.tracking-meta {
 font-size: 13px;
 color: #555;
 line-height: 1.8;
}

.track-btn {
 display: inline-block;
 margin-top: 14px;
 padding: 11px 26px;
 background-color: #1a73e8;
 color: #ffffff;
 text-decoration: none;
 border-radius: 5px;
 font-size: 14px;
 font-weight: bold;
}

/* Progress Bar */
.progress-wrapper {
 margin: 22px 0;
}

.progress-label {
 font-size: 13px;
 font-weight: bold;
 color: #444;
 margin-bottom: 10px;
}

.progress-steps {
 display: flex;
 align-items: center;
 justify-content: space-between;
 position: relative;
}

.progress-line {
 position: absolute;
 top: 13px;
 left: 0;
 right: 0;
 height: 3px;
 background: #ddd;
 z-index: 0;
}

.progress-line-fill {
 height: 3px;
 background: #1a73e8;
 width: 50%;
}

.progress-step {
 display: flex;
 flex-direction: column;
 align-items: center;
 z-index: 1;
 flex: 1;
}

.step-circle {
 width: 26px;
 height: 26px;
 border-radius: 50%;
 background: #ddd;
 display: flex;
 align-items: center;
 justify-content: center;
 font-size: 12px;
 color: #fff;
 font-weight: bold;
 margin-bottom: 6px;
}

.step-circle.done {
 background: #1a73e8;
}

.step-circle.active {
 background: #1a73e8;
 box-shadow: 0 0 0 3px #c5d8fc;
}

.step-text {
 font-size: 11px;
 color: #777;
 text-align: center;
 max-width: 60px;
}

.step-text.active {
 color: #1a73e8;
 font-weight: bold;
}

/* Items */
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

.divider {
 border: none;
 border-top: 1px solid #eee;
 margin: 22px 0;
}

.delivery-box {
 background: #fafafa;
 border-left: 3px solid #ccc;
 padding: 12px 16px;
 border-radius: 4px;
 font-size: 14px;
 color: #444;
 margin-bottom: 20px;
}

.notice {
 background: #fffde7;
 border: 1px solid #fff176;
 border-radius: 5px;
 padding: 12px 16px;
 font-size: 13px;
 color: #7d6608;
 margin-top: 10px;
}

.support-link {
 color: #1a73e8;
 font-weight: bold;
 text-decoration: none;
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
 <div class="header-title">Uw bestelling is onderweg! </div>
 <div class="header-sub">Even geduld: uw pakket is onderweg naar u</div>
 </div>

 <div class="content">

 <div class="banner">
 Bestelling #${data.orderNumber} is succesvol verzonden.
 </div>

 <p>Hallo <strong>${userName}</strong>,</p>
 <p>
 Goed nieuws! Uw bestelling is overgedragen aan <strong>${data.courierName}</strong>
 en is nu onderweg naar uw adres. Gebruik de trackinggegevens hieronder om
 uw pakket realtime te volgen.
 </p>

 <div class="order-box">
 <strong>Bestelnummer:</strong> ${data.orderNumber} <br/>
 <strong>Verzenddatum:</strong> ${data.shippedDate} <br/>
 <strong>Koerier:</strong> ${data.courierName} <br/>
 <strong>Geschatte levering:</strong> ${data.estimatedDelivery}
 </div>

 <!-- Tracking Card -->
 <div class="tracking-card">
 <div class="tracking-card-header"> Trackinginformatie</div>
 <div class="tracking-card-body">
 <div style="font-size:13px; color:#555;">Trackingnummer</div>
 <div class="tracking-number">${data.trackingNumber}</div>
 <div class="tracking-meta">
 <strong>Koerier:</strong> ${data.courierName}<br/>
 <strong>Verwacht op:</strong> ${data.estimatedDelivery}
 </div>
 ${
 data.trackingLink
 ? `<a href="${data.trackingLink}" class="track-btn">Volg mijn pakket </a>`
 : ""
 }
 </div>
 </div>

 <!-- Progress Bar -->
 <div class="progress-wrapper">
 <div class="progress-label">Bezorgvoortgang</div>
 <div class="progress-steps">
 <div class="progress-line">
 <div class="progress-line-fill"></div>
 </div>
 <div class="progress-step">
 <div class="step-circle done"></div>
 <div class="step-text">Bestelling geplaatst</div>
 </div>
 <div class="progress-step">
 <div class="step-circle done"></div>
 <div class="step-text">Ingepakt</div>
 </div>
 <div class="progress-step">
 <div class="step-circle active"></div>
 <div class="step-text active">Verzonden</div>
 </div>
 <div class="progress-step">
 <div class="step-circle"></div>
 <div class="step-text">Geleverd</div>
 </div>
 </div>
 </div>

 <hr class="divider" />

 <h3>Items Verzonden</h3>

 ${data.items
 .map(
 (item) => `
 <div class="product">
 <img src="${item.image}" alt="${item.name}" />
 <div class="product-info">
 <div class="product-name">${item.name}</div>
 <div class="product-meta">Aantal: ${item.quantity}</div>
 <div class="product-meta">Prijs: EUR ${item.price}</div>
 </div>
 </div>
 `,
 )
 .join("")}

 <div class="summary">
 <div class="total">Besteltotaal: EUR ${data.totalAmount}</div>
 </div>

 <hr class="divider" />

 <h3>Bezorgadres</h3>
 <div class="delivery-box">
 ${data.deliveryAddress}
 </div>

 <div class="notice">
 <strong>Let op:</strong> Bezorgtijden kunnen varieren door weekenden, feestdagen,
 of onverwachte vertragingen bij de koerier. Als uw pakket niet aankomt op
 <strong>${data.estimatedDelivery}</strong>, neem dan contact op met onze klantenservice.
 </div>

 ${
 data.supportLink
 ? `
 <p style="margin-top: 22px; font-size: 13px; color: #666;">
 Hebt u vragen over uw zending?
 <a href="${data.supportLink}" class="support-link">Neem contact op met support</a>
 </p>
 `
 : ""
 }

 <p style="margin-top: 20px;">
 Bedankt voor uw aankoop bij ons. We hopen dat u blij bent met uw bestelling!
 </p>

 </div>

 <div class="footer">
 Hulp nodig? Neem op elk moment contact op met onze klantenservice.<br/>
 ${new Date().getFullYear()} Spandeok Print. Alle rechten voorbehouden.
 </div>

</div>

</body>
</html>
`;

 await sendEmail(email, subject, html);
};
