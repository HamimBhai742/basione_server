import { prisma } from "../app/lib/prisma";
import { generateAllMockups } from "../app/utils/generateAllMockups";
import { uploadBufferToS3 } from "../app/utils/uploadAws";
import axios from "axios";

async function main() {
  console.log("Starting mockup migration for existing templates...");
  
  // Find all templates or readymades
  const allTemplates = await prisma.banner.findMany({
    where: {
      OR: [
        { isTemplate: true },
        { isReadymade: true }
      ]
    }
  });

  // Filter to only include banner templates/readymades (exclude tuinposters/garden posters)
  const templates = allTemplates.filter(t => 
    t.templateCategoryId !== null || 
    (t.templateCategoryIds && t.templateCategoryIds.length > 0)
  );

  console.log(`Found ${templates.length} banner templates to process.`);

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    console.log(`[${i + 1}/${templates.length}] Processing template: ${template.headline || "Unnamed"} (ID: ${template.id})`);

    // Check if mockups are already generated to avoid re-generating (idempotent script)
    if (
      template.mockupFirstUrl &&
      template.mockupHedgeUrl &&
      template.mockupPartyUrl &&
      template.mockupRailingUrl &&
      template.mockupLawnNewUrl &&
      template.mockupGardenUrl
    ) {
      console.log(`  -> Mockups already exist. Skipping.`);
      continue;
    }

    if (!template.imageUrl) {
      console.log(`  -> No imageUrl found. Skipping.`);
      continue;
    }

    try {
      console.log(`  -> Downloading image: ${template.imageUrl}`);
      const response = await axios.get(template.imageUrl, { responseType: "arraybuffer" });
      const bannerBuffer = Buffer.from(response.data);

      console.log(`  -> Generating mockups...`);
      const mockups = await generateAllMockups(bannerBuffer);

      const uploadMockup = async (buffer: Buffer, name: string) => {
        return uploadBufferToS3({
          buffer,
          key: `mockups/${Date.now()}-${name}.png`,
          contentType: "image/png",
        });
      };

      console.log(`  -> Uploading mockups to S3...`);
      const [first, hedge, party, railing, lawnNew, garden] = await Promise.all([
        uploadMockup(mockups.first, "first"),
        uploadMockup(mockups.hedge, "hedge"),
        uploadMockup(mockups.party, "party"),
        uploadMockup(mockups.railing, "railing"),
        uploadMockup(mockups.lawnNew, "lawn-new"),
        uploadMockup(mockups.garden, "garden"),
      ]);

      console.log(`  -> Updating database record...`);
      await prisma.banner.update({
        where: { id: template.id },
        data: {
          mockupFirstUrl: first,
          mockupHedgeUrl: hedge,
          mockupPartyUrl: party,
          mockupRailingUrl: railing,
          mockupLawnNewUrl: lawnNew,
          mockupGardenUrl: garden,
          mockupUrl: garden, // backwards compatibility
        }
      });

      console.log(`  -> Done!`);
    } catch (error: any) {
      console.error(`  -> ERROR processing template ${template.id}:`, error.message);
    }
  }

  console.log("Mockup migration completed!");
}

main()
  .catch((e) => {
    console.error("Migration script crashed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
