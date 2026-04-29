import { prisma } from "../lib/prisma";

export const getNextOrderNumber = async () => {
  const year = new Date().getFullYear();
  const key = `order_${year}`;

  const counter = await prisma.counter.upsert({
    where: { key },
    update: {
      seq: { increment: 1 },
    },
    create: {
      key,
      seq: 1,
    },
  });

  return `ORD-${year}-${String(counter.seq).padStart(6, "0")}`;
};