import { prisma } from "../app/lib/prisma";

async function main() {
  const sourceTemplate = await prisma.banner.findUnique({
    where: {
      id: "6a6f27f45d37f2332f6a1e25"
    }
  });

  console.log("==========================================");
  console.log("Source Template Document:");
  console.log(JSON.stringify(sourceTemplate, null, 2));
  console.log("==========================================");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
