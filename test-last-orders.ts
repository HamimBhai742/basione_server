import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './src/app/lib/prisma';

async function run() {
  try {
    console.log('Querying the 5 most recent orders...');
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        payment: true,
        invoice: true,
        addresses: true,
      }
    });

    console.log('Recent Orders:', JSON.stringify(orders.map(o => ({
      id: o.id,
      trackingNumber: o.trackingNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      isGuest: o.isGuest,
      guestEmail: o.guestEmail,
      guestName: o.guestName,
      addressEmail: o.addresses?.email,
      addressName: o.addresses?.name,
      payment: o.payment ? { id: o.payment.id, status: o.payment.status, transactionId: o.payment.transactionId } : null,
      invoice: o.invoice ? { id: o.invoice.id, status: o.invoice.status, invoiceNumber: o.invoice.invoiceNumber } : null,
      createdAt: o.createdAt
    })), null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
