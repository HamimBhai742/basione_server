import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './src/app/lib/prisma';
import { paymentService } from './src/app/modules/payment/payment.service';

async function run() {
  try {
    const paymentId = '6a33930c67418108e13058bc';
    console.log(`Running syncPaymentStatus for payment ${paymentId}...`);
    
    const result = await paymentService.syncPaymentStatus(paymentId);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error in sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
