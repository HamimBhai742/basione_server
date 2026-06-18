import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './src/app/lib/prisma';

async function run() {
  try {
    const bannerId = '6a338f36fc92e0148daefd2a';
    console.log(`Checking orders associated with banner ${bannerId}...`);
    
    const orders = await prisma.order.findMany({
      where: { bannerId },
      include: {
        payment: true,
      }
    });

    console.log('Orders found:', JSON.stringify(orders, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
