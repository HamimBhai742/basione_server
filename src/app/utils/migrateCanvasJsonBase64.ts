import { prisma } from "../lib/prisma";
import { processCanvasJsonImages } from "./processCanvasJson";

export const migrateCanvasJsonBase64 = async () => {
  console.log("🚀 Starting CanvasJSON Base64 to S3 Migration...");

  try {
    const banners = await prisma.banner.findMany({
      where: {
        canvasJSON: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });

    console.log(`📊 Found ${banners.length} total banner(s) with canvasJSON in MongoDB.`);

    let totalBytesSaved = 0;
    let totalImagesUploaded = 0;
    let migratedCount = 0;

    for (let i = 0; i < banners.length; i++) {
      const bannerId = banners[i].id;
      const b = await prisma.banner.findUnique({
        where: { id: bannerId },
        select: {
          id: true,
          name: true,
          headline: true,
          canvasJSON: true,
        },
      });

      if (!b || !b.canvasJSON || !b.canvasJSON.includes("data:image/")) {
        continue;
      }

      const initialJson = b.canvasJSON;
      const initialBytes = Buffer.byteLength(initialJson, "utf-8");

      console.log(
        `\n[${migratedCount + 1}] Processing Banner ID: ${b.id} (${b.name || b.headline || "Untitled"})`,
      );
      console.log(
        `   Initial canvasJSON size: ${(initialBytes / (1024 * 1024)).toFixed(2)} MB`,
      );

      const updatedJson = await processCanvasJsonImages(initialJson);

      if (updatedJson && updatedJson !== initialJson) {
        const finalBytes = Buffer.byteLength(updatedJson, "utf-8");
        const bytesSaved = initialBytes - finalBytes;
        totalBytesSaved += Math.max(0, bytesSaved);

        await prisma.banner.update({
          where: { id: b.id },
          data: { canvasJSON: updatedJson },
        });

        const matches = initialJson.match(
          /"data:image\/[a-zA-Z0-9\+\-\.]+;base64,[A-Za-z0-9+/=]+"/g,
        );
        const imagesCount = matches ? new Set(matches).size : 0;
        totalImagesUploaded += imagesCount;
        migratedCount++;

        console.log(
          `   ✅ Successfully migrated! New size: ${(finalBytes / 1024).toFixed(2)} KB (Saved ${(bytesSaved / (1024 * 1024)).toFixed(2)} MB)`,
        );
      }
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log(
      `📈 Summary: Migrated ${migratedCount} banner(s), uploaded ${totalImagesUploaded} image(s) to S3, freed up ${(totalBytesSaved / (1024 * 1024)).toFixed(2)} MB of MongoDB storage!`,
    );
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  migrateCanvasJsonBase64()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
