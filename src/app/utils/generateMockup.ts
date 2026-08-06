import sharp from "sharp";
import path from "path";
import fs from "fs";
import { AppError } from "../error/AppError";

/**
 * Generates a mockup image by overlaying a banner design onto a garden background image.
 * The garden background image size is 705x469.
 * The frame bounding box: left = 152, top = 94, width = 413, height = 192.
 *
 * @param bannerBuffer The buffer of the original flat banner image uploaded by the admin.
 * @returns The buffer of the generated garden mockup image.
 */

const getBgPath = (): string => {
  const pathsToTry = [
    // 1. Development: src/app/utils/ -> src/app/assets/
    path.join(__dirname, "..", "assets", "tuinposter_bg.png"),

    // 2. Production compiled: dist/app/utils/ -> src/app/assets/
    path.join(__dirname, "..", "..", "..", "src", "app", "assets", "tuinposter_bg.png"),

    // 3. Relative to process.cwd() (src structure)
    path.join(process.cwd(), "src", "app", "assets", "tuinposter_bg.png"),

    // 4. Relative to process.cwd() (dist structure)
    path.join(process.cwd(), "dist", "app", "assets", "tuinposter_bg.png"),

    // 5. Fallback: direct app/assets
    path.join(process.cwd(), "app", "assets", "tuinposter_bg.png"),
  ];

  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      // console.log(`[Mockup BG] Using background at: ${p}`);
      return p;
    }
  }

  // Last resort – return development path and let sharp throw a descriptive error
  const fallback = path.join(__dirname, "..", "assets", "tuinposter_bg.png");
  console.warn(`[Mockup BG] WARNING: tuinposter_bg.png not found. Falling back to: ${fallback}`);
  return fallback;
};

export const generateGardenMockup = async (bannerBuffer: Buffer): Promise<Buffer> => {
  try {
    const bgPath = getBgPath();

    // Frame bounding box inside tuinposter_bg.png
    const frameLeft = 151;
    const frameTop = 249;
    const frameWidth = 738;
    const frameHeight = 503;

    // Resize banner design to fill the entire frame area completely (removing white board)
    const resizedBanner = await sharp(bannerBuffer)
      .resize(frameWidth, frameHeight, { fit: "cover" })
      .toBuffer();

    const mockupBuffer = await sharp(bgPath)
      .composite([
        {
          input: resizedBanner,
          left: frameLeft,
          top: frameTop,
        },
      ])
      .png()
      .toBuffer();

    return mockupBuffer;
  } catch (error: any) {
    throw new AppError(`Fout bij het genereren van mockup: ${error.message}`, 500);
  }
};
