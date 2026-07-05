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
    const originalWidth = 705;
    const originalHeight = 469;

    // Get input design image metadata to find aspect ratio
    const bannerMetadata = await sharp(bannerBuffer).metadata();
    const bannerWidth = bannerMetadata.width || 413;
    const bannerHeight = bannerMetadata.height || 192;

    // Frame bounding box inside tuinposter_bg.png
    const frameLeft = 152;
    const frameTop = 94;
    const frameWidth = 413;
    const frameHeight = 192;
    const frameRatio = frameWidth / frameHeight;

    // Calculate poster dimensions maintaining aspect ratio
    const designRatio = bannerWidth / bannerHeight;
    let newWidth = frameWidth;
    let newHeight = frameHeight;

    if (designRatio > frameRatio) {
      newWidth = frameWidth;
      newHeight = Math.round(frameWidth / designRatio);
    } else {
      newHeight = frameHeight;
      newWidth = Math.round(frameHeight * designRatio);
    }

    // Resize design banner
    const resizedBanner = await sharp(bannerBuffer)
      .resize(newWidth, newHeight, { fit: "fill" })
      .toBuffer();

    // Calculate horizontal scale factor to shrink/adjust background frame width
    const scaleX = newWidth / frameWidth;
    const finalMockupWidth = Math.round(originalWidth * scaleX);

    // Resize background image (tuinposter_bg.png) horizontally
    const scaledBg = await sharp(bgPath)
      .resize(finalMockupWidth, originalHeight, { fit: "fill" })
      .toBuffer();

    // Extract a tile of brick wall from the top of the scaled background image
    // to fill any vertical cutout gaps (for panoramic banners)
    const wallTile = await sharp(scaledBg)
      .extract({ left: 0, top: 0, width: finalMockupWidth, height: 94 })
      .resize(newWidth, frameHeight, { fit: "cover" })
      .toBuffer();

    // Position of the banner inside the wall tile
    const bannerLeftInCutout = 0;
    const bannerTopInCutout = Math.round((frameHeight - newHeight) / 2);

    // Composite banner onto the wall tile
    const cutoutContent = await sharp(wallTile)
      .composite([
        {
          input: resizedBanner,
          left: bannerLeftInCutout,
          top: bannerTopInCutout
        }
      ])
      .png()
      .toBuffer();

    const newFrameLeft = Math.round(frameLeft * scaleX);

    // Create base canvas and composite cutoutContent
    const baseCanvas = await sharp({
      create: {
        width: finalMockupWidth,
        height: originalHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      {
        input: cutoutContent,
        left: newFrameLeft,
        top: frameTop
      }
    ])
    .png()
    .toBuffer();

    // Composite the scaled background on top
    const mockupBuffer = await sharp(baseCanvas)
      .composite([
        {
          input: scaledBg,
          left: 0,
          top: 0
        }
      ])
      .png()
      .toBuffer();

    return mockupBuffer;
  } catch (error: any) {
    throw new AppError(`Fout bij het genereren van mockup: ${error.message}`, 500);
  }
};
