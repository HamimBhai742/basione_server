import { generateInvoicePdf } from './src/app/modules/invoice/invoice.pdf';
import fs from 'fs';

async function run() {
  try {
    console.log('Generating PDF...');
    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: 'INV-123',
      orderId: 'ORD-123',
      orderDate: '2026-05-15',
      customer: { name: 'Test', email: 'test@test.com' },
      shippingAddress: { address: 'Test address' },
      banner: { name: 'Banner', quantity: 1, unitPrice: 10, imageUrl: 'https://imglink.cc/cdn/Ow8ExrW8jK.png' },
      pricing: { subtotal: 10, deliveryFee: 0, eyeletsFee: 0, priceExcludingVat: 10, vatRate: 21, vatAmount: 2.1, total: 12.1 },
      payment: { method: 'ideal', transactionId: 'TXN-123' }
    });
    fs.writeFileSync('test.pdf', pdfBuffer);
    console.log('Done, wrote test.pdf');
  } catch (e) {
    console.error(e);
  }
}
run();
