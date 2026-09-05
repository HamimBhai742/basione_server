import { prisma } from "../app/lib/prisma";

async function run() {
  console.log("1. Cleaning banner 6a830c577dc94a8d10abc57c...");
  const pRecord = await prisma.banner.findUnique({
    where: { id: "6a830c577dc94a8d10abc57c" },
  });
  if (pRecord && pRecord.headline.startsWith("Producttitel ")) {
    const cleanHeadline = pRecord.headline.replace(/^Producttitel\s+/i, "");
    await prisma.banner.update({
      where: { id: "6a830c577dc94a8d10abc57c" },
      data: { headline: cleanHeadline },
    });
    console.log(`Updated 6a830c577dc94a8d10abc57c headline to: "${cleanHeadline}"`);
  }

  // Check any other banner with "producttitel"
  const remainingProducttitel = await prisma.banner.findMany({
    where: {
      OR: [
        { headline: { contains: "producttitel", mode: "insensitive" } },
        { name: { contains: "producttitel", mode: "insensitive" } },
      ],
    },
  });
  for (const b of remainingProducttitel) {
    const newHeadline = b.headline.replace(/producttitel\s*/gi, "").trim() || "Spandoek op Maat";
    const newName = b.name ? b.name.replace(/producttitel\s*/gi, "").trim() : null;
    await prisma.banner.update({
      where: { id: b.id },
      data: {
        headline: newHeadline,
        name: newName,
      },
    });
    console.log(`Cleaned banner ${b.id}: headline="${newHeadline}"`);
  }

  // 2. Clean/remove the 12 dummy Latin test records
  const dummyLatinIds = [
    "6a094212565bee9d773129a8",
    "6a09b1ce235164d5b0703764",
    "6a09b1ce235164d5b0703765",
    "6a09b1ce235164d5b0703766",
    "6a09b1ce235164d5b0703767",
    "6a21551418cfe076d580fba1",
    "6a2268dbd3d0cb201628de31",
    "6a228fe7e50e784538def016",
    "6a229cbc22f50da34643c31a",
    "6a3e52bc5c50438ce97dfa5f",
    "6a570d38caf3e5bad6a7025c",
    "6a5748df667fd70ca87b2969",
  ];

  console.log(`Cleaning ${dummyLatinIds.length} dummy Latin records...`);
  // Remove any cart or wishlist references if exist, then delete banner
  await prisma.cartItem.deleteMany({ where: { bannerId: { in: dummyLatinIds } } });
  await prisma.wishlistItem.deleteMany({ where: { bannerId: { in: dummyLatinIds } } });
  const deleteResult = await prisma.banner.deleteMany({
    where: {
      id: { in: dummyLatinIds },
      isOrdered: false,
      isTemplate: false,
    },
  });
  console.log(`Deleted ${deleteResult.count} dummy Latin test banners.`);
}

async function main() {
  try {
    await run();
  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
