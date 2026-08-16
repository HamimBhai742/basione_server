import { generateGardenMockup } from "../app/utils/generateMockup";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Testing generateGardenMockup...");
  const sampleImagePath = path.join(__dirname, "..", "app", "assets", "tuinposter_bg.png");
  if (!fs.existsSync(sampleImagePath)) {
    console.error("Sample image not found at:", sampleImagePath);
    return;
  }
  const buffer = fs.readFileSync(sampleImagePath);
  console.log("Sample image loaded successfully. Buffer size:", buffer.length);

  try {
    const mockupBuffer = await generateGardenMockup(buffer);
    console.log("SUCCESS! Mockup generated successfully. Output buffer size:", mockupBuffer.length);
  } catch (error: any) {
    console.error("FAILED to generate mockup. Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

main();
