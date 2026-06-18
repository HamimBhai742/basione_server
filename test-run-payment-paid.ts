import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './src/app/lib/prisma';
import { paymentService } from './src/app/modules/payment/payment.service';
import { mollieClient } from './src/app/lib/mollie';

async function run() {
  try {
    const paymentId = '6a338b5ffc92e0148daefd26';
    const orderId = '6a338b3afc92e0148daefd24';

    console.log(`Starting mock paymentPaid for order ${orderId}...`);

    // Reset payment and order status in DB to simulate webhook/sync processing
    console.log("Resetting payment status to pending and updating paymentJSON...");
    await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status: 'pending',
        paymentJSON: {
          molliePaymentId: 'tr_3QNXSkZzR4k7yXjC4DmSJ',
          mollieStatus: 'paid'
        }
      }
    });

    console.log("Resetting order paymentStatus to pending...");
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'pending',
        status: 'pending'
      }
    });

    console.log("Calling syncPaymentStatus...");
    const result = await paymentService.syncPaymentStatus(paymentId, undefined, '74350e094bb93eebbd8e368f83d0f3ee781d3a619731175ba6844de044540072');
    console.log("syncPaymentStatus finished. Result:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("Error in test run:", error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
