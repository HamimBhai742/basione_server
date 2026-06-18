import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './src/app/lib/prisma';
import { paymentService } from './src/app/modules/payment/payment.service';

async function run() {
  try {
    const molliePaymentId = 'tr_CFR2RSETJsY4CCPvwEmSJ';
    console.log(`Calling mollieWebhook for guest order with Mollie Payment ID: ${molliePaymentId}...`);
    const result = await paymentService.mollieWebhook(molliePaymentId);
    console.log('Webhook execution result:', result);
  } catch (error) {
    console.error('Error in webhook execution:', error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
