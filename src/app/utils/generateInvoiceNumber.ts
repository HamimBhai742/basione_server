import { prisma } from "../lib/prisma";

export const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();

  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}`,
      },
    },
  });

  const nextNumber = String(count + 1).padStart(5, "0");

  return `INV-${year}-${nextNumber}`;
};