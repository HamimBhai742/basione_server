const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to MongoDB via Prisma Client!");

    // Find all orders where guestOrderToken is null
    const orders = await prisma.order.findMany({
      where: {
        guestOrderToken: null
      }
    });

    console.log(`Found ${orders.length} orders with null guestOrderToken.`);

    // Loop through each and update to a unique random token (e.g. guest-temp-uniqueId)
    // to avoid the duplicate key error.
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const uniqueToken = `temp-token-${order.id}-${Math.random().toString(36).substring(2, 9)}`;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          guestOrderToken: uniqueToken
        }
      });
      console.log(`Updated order ${order.id} with guestOrderToken = ${uniqueToken}`);
    }

    console.log("Database update completed!");
  } catch (err) {
    console.error("Prisma script error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
