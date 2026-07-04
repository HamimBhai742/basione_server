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
      console.log(`[Mockup BG] Using background at: ${p}`);
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
    const width = 705;
    const height = 469;

    // Resize the input design image to fit inside the frame (413x192 pixels)
    const resizedBanner = await sharp(bannerBuffer)
      .resize(413, 192, {
        fit: "fill"
      })
      .toBuffer();

    // 1. Create a transparent base canvas of 705x469 and place the banner at the frame offset
    const baseCanvas = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      {
        input: resizedBanner,
        left: 152,
        top: 94,
      }
    ])
    .png()
    .toBuffer();

    // 2. Composite the transparent wall template background ON TOP of the base canvas
    const mockupBuffer = await sharp(baseCanvas)
      .composite([
        {
          input: bgPath,
          left: 0,
          top: 0,
        }
      ])
      .png()
      .toBuffer();

    return mockupBuffer;
  } catch (error: any) {
    throw new AppError(`Fout bij het genereren van mockup: ${error.message}`, 500);
  }
};
