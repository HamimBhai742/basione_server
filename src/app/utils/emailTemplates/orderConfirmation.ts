import { OrderConfirmedEmailData } from "../../../type/interface";
import sendEmail from "./nodemailerTransport";



const formatCurrency = (amount: number) => {
  return `€${Number(amount || 0).toFixed(2)}`;
};

const safeText = (value?: string | null) => {
  return value && value.trim() ? value : "-";
};

export const orderConfirmedTemplate = async (data: OrderConfirmedEmailData) => {
  const subject = `Bestelling bevestigd - ${data.orderId}`;

  const deliveryAddress = `
    ${safeText(data.shippingAddress.name)}<br/>
    ${
      data.shippingAddress.companyName
        ? `${data.shippingAddress.companyName}<br/>`
        : ""
    }
    ${safeText(data.shippingAddress.street)} ${safeText(
      data.shippingAddress.houseNumber,
    )}<br/>
    ${
      data.shippingAddress.address ? `${data.shippingAddress.address}<br/>` : ""
    }
    ${safeText(data.shippingAddress.zipCode)} ${safeText(
      data.shippingAddress.city,
    )}<br/>
    ${data.shippingAddress.phone ? `Tel: ${data.shippingAddress.phone}<br/>` : ""}
    ${data.shippingAddress.email ? `Email: ${data.shippingAddress.email}` : ""}
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Bestelling bevestigd</title>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.container {
  max-width: 700px;
  margin: 20px auto;
  background: #ffffff;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.header {
  background-color: #2563eb;
  color: #ffffff;
  padding: 24px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 22px;
}

.header p {
  margin: 8px 0 0;
  font-size: 14px;
  opacity: 0.95;
}

.content {
  padding: 28px 30px;
  color: #333333;
}

.order-box {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  font-size: 14px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 17px;
  margin: 24px 0 12px;
  color: #111827;
}

.product {
  display: flex;
  gap: 14px;
  margin-bottom: 15px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.product img {
  width: 78px;
  height: 78px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.product-info {
  font-size: 14px;
  line-height: 1.6;
}

.summary {
  border-top: 1px solid #e5e7eb;
  padding-top: 14px;
  margin-top: 18px;
  font-size: 14px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
}

.total {
  font-size: 17px;
  font-weight: bold;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.address-box {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  line-height: 1.7;
}

.invoice-box {
  background: #eff6ff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
  margin-top: 20px;
  font-size: 14px;
}

.invoice-button {
  display: inline-block;
  margin-top: 10px;
  background: #2563eb;
  color: #ffffff !important;
  padding: 10px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  font-size: 14px;
}

.footer {
  background: #f9fafb;
  text-align: center;
  padding: 18px;
  font-size: 12px;
  color: #777777;
  border-top: 1px solid #e5e7eb;
}

@media only screen and (max-width: 600px) {
  .container {
    margin: 0;
    border-radius: 0;
  }

  .content {
    padding: 22px 18px;
  }

  .product {
    flex-direction: column;
  }

  .product img {
    width: 100%;
    height: auto;
    max-height: 220px;
  }
}
</style>
</head>

<body>
  <div class="container">
    <div class="header">
      <h1>Bestelling bevestigd ✔</h1>
      <p>Bedankt voor uw bestelling. Wij hebben uw betaling ontvangen.</p>
    </div>

    <div class="content">
      <p>Hallo <strong>${data.userName}</strong>,</p>

      <p>
        Uw bestelling is succesvol geplaatst en wordt nu verwerkt.
      </p>

      <div class="order-box">
        <strong>Order ID:</strong> ${data.orderId}<br/>
        <strong>Orderdatum:</strong> ${data.orderDate}<br/>
        <strong>Betaalmethode:</strong> ${data.paymentMethod}<br/>
        <strong>Geschatte levering/afhalen:</strong> ${safeText(
          data.estimatedDelivery,
        )}
        ${
          data.invoiceNumber
            ? `<br/><strong>Factuurnummer:</strong> ${data.invoiceNumber}`
            : ""
        }
      </div>

      <h3 class="section-title">Bestelde items</h3>

      ${data.items
        .map(
          (item) => `
        <div class="product">
          ${
            item.imageUrl
              ? `<img src="${item.imageUrl}" alt="${item.name}" />`
              : ""
          }

          <div class="product-info">
            <div><strong>${item.name}</strong></div>
            <div>Aantal: ${item.quantity}</div>
            <div>Prijs per stuk: ${formatCurrency(item.price)}</div>
            <div>Totaal item: ${formatCurrency(item.price * item.quantity)}</div>
          </div>
        </div>
      `,
        )
        .join("")}

      <h3 class="section-title">Prijsberekening</h3>

      <div class="summary">
        <div class="summary-row">
          <span>Subtotaal</span>
          <strong>${formatCurrency(data.subtotal)}</strong>
        </div>

        <div class="summary-row">
          <span>Levering / Afhalen</span>
          <strong>${formatCurrency(data.deliveryFee)}</strong>
        </div>

        <div class="summary-row">
          <span>Ringen / Eyelets</span>
          <strong>${formatCurrency(data.eyeletsFee || 0)}</strong>
        </div>

        <div class="summary-row">
          <span>Prijs excl. 21% BTW</span>
          <strong>${formatCurrency(data.priceExcludingVat)}</strong>
        </div>

        <div class="summary-row">
          <span>BTW ${Math.round((data.vatRate || 0.21) * 100)}%</span>
          <strong>${formatCurrency(data.vatAmount)}</strong>
        </div>

        <div class="summary-row total">
          <span>Totaal incl. BTW</span>
          <strong>${formatCurrency(data.total)}</strong>
        </div>
      </div>

      <h3 class="section-title">Adresgegevens</h3>

      <div class="address-box">
        ${deliveryAddress}
      </div>

      ${
        data.invoiceUrl
          ? `
        <div class="invoice-box">
          <strong>Factuur beschikbaar</strong><br/>
          Uw PDF-factuur is aangemaakt en beschikbaar via onderstaande link.
          <br/>
          <a href="${data.invoiceUrl}" class="invoice-button" target="_blank">
            Factuur downloaden
          </a>
        </div>
      `
          : ""
      }

      <p style="margin-top: 24px;">
        U ontvangt opnieuw bericht zodra uw bestelling verder wordt verwerkt of klaar is voor levering/afhalen.
      </p>
    </div>

    <div class="footer">
      Hulp nodig? Neem contact op met onze klantenservice.<br/>
      © ${new Date().getFullYear()} Spandoek Print. Alle rechten voorbehouden.
    </div>
  </div>
</body>
</html>
`;

  await sendEmail(
    data.email,
    subject,
    html,
    undefined,
    data.invoiceFilePath
      ? [
          {
            filename: `${data.invoiceNumber || "invoice"}.pdf`,
            path: data.invoiceFilePath,
            contentType: "application/pdf",
          },
        ]
      : [],
  );
};
