import sharp from "sharp";
import path from "path";
import { AppError } from "../error/AppError";

/**
 * Generates a mockup image by overlaying a banner design onto a garden background image.
 * The garden background image size is 701x574.
 * The frame bounding box: left = 63, top = 36, width = 579, height = 328.
 *
 * @param bannerBuffer The buffer of the original flat banner image uploaded by the admin.
 * @returns The buffer of the generated garden mockup image.
 */
export const generateGardenMockup = async (bannerBuffer: Buffer): Promise<Buffer> => {
  try {
    const bgPath = path.join(__dirname, "../assets/tuinposter_bg.png");
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
