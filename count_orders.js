const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected!");

    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        guestOrderToken: true
      }
    });

    console.log(`Total orders: ${allOrders.length}`);
    
    const tokenMap = {};
    const duplicates = [];

    allOrders.forEach(o => {
      const tok = o.guestOrderToken;
      if (tok !== undefined && tok !== null) {
        if (tokenMap[tok]) {
          duplicates.push({ id: o.id, token: tok, otherId: tokenMap[tok] });
        } else {
          tokenMap[tok] = o.id;
        }
      } else {
        duplicates.push({ id: o.id, token: tok, reason: "null or undefined" });
      }
    });

    console.log(`Duplicates / Nulls count: ${duplicates.length}`);
    console.log("First 10 duplicates/nulls:", duplicates.slice(0, 10));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
