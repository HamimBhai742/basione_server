import { prisma } from "../app/lib/prisma";
import { generateGardenMockup } from "../app/utils/generateMockup";
import { uploadBufferToS3 } from "../app/utils/uploadAws";
import axios from "axios";

async function main() {
  console.log("Starting mockup generation for existing Tuinposters...");

  // Find all readymade tuinposters where mockupUrl is null or empty
  const tuinposters = await prisma.banner.findMany({
    where: {
      isReadymade: true,
      OR: [
        { mockupUrl: null },
        { mockupUrl: "" }
      ]
    }
  });

  console.log(`Found ${tuinposters.length} tuinposters with missing mockups.`);

  for (let i = 0; i < tuinposters.length; i++) {
    const poster = tuinposters[i];
    console.log(`[${i + 1}/${tuinposters.length}] Processing: ${poster.headline || poster.name || "Unnamed"} (ID: ${poster.id})`);

    if (!poster.imageUrl) {
      console.log(`  -> No imageUrl found. Skipping.`);
      continue;
    }

    try {
      console.log(`  -> Downloading design image: ${poster.imageUrl}`);
      const response = await axios.get(poster.imageUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);

      console.log(`  -> Generating garden mockup...`);
      const gardenMockupBuffer = await generateGardenMockup(buffer);

      console.log(`  -> Uploading mockup to S3...`);
      const uploadedGardenUrl = await uploadBufferToS3({
        buffer: gardenMockupBuffer,
        key: `mockups/${Date.now()}-mockup.png`,
        contentType: "image/png",
      });

      console.log(`  -> Updating database record with mockupUrl...`);
      await prisma.banner.update({
        where: { id: poster.id },
        data: {
          mockupUrl: uploadedGardenUrl
        }
      });

      console.log(`  -> Success! Mockup saved: ${uploadedGardenUrl}`);
    } catch (error: any) {
      console.error(`  -> ERROR processing tuinposter ${poster.id}:`, error.message);
    }
  }

  console.log("Mockup generation completed for all tuinposters!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Script failed:", e);
    prisma.$disconnect();
  });
