const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to database!");

    // Fetch all orders
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        guestOrderToken: true
      }
    });

    console.log(`Loaded ${orders.length} orders total.`);

    const updates = [];
    for (const order of orders) {
      const token = order.guestOrderToken;
      if (!token || typeof token !== 'string' || token.trim() === '') {
        const uniqueToken = `guest-token-${order.id}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`Scheduling update for order ${order.id}`);
        updates.push(
          prisma.order.update({
            where: { id: order.id },
            data: {
              guestOrderToken: uniqueToken
            }
          }).then(() => {
            console.log(`Updated order ${order.id}`);
          })
        );
      }
    }

    if (updates.length > 0) {
      console.log(`Executing ${updates.length} updates in parallel...`);
      await Promise.all(updates);
      console.log("All updates completed successfully!");
    } else {
      console.log("No orders needed updates.");
    }
  } catch (err) {
    console.error("Clean script failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
