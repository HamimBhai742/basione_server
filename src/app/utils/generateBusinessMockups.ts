import sharp from "sharp";
import path from "path";
import fs from "fs";
import { AppError } from "../error/AppError";

interface Inset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface MockupConfig {
  filename: string;
  inset: Inset;
}

const businessMockupsConfig: Record<string, MockupConfig> = {
  template1: {
    filename: "Template1.png",
    inset: { top: 22.89, right: 7.39, bottom: 22.89, left: 11.29 },
  },
  template2: {
    filename: "Template2.png",
    inset: { top: 29.69, right: 21.08, bottom: 31.91, left: 20.28 },
  },
  template3: {
    filename: "Template3.png",
    inset: { top: 27.32, right: 10.45, bottom: 19.94, left: 10.45 },
  },
  template4: {
    filename: "Template4.png",
    inset: { top: 22.38, right: 24.00, bottom: 43.00, left: 24.03 },
  },
  template5: {
    filename: "Template5.png",
    inset: { top: 15.84, right: 27.78, bottom: 54.04, left: 27.02 },
  },
  template6: {
    filename: "Template6.png",
    inset: { top: 27.29, right: 17.87, bottom: 29.05, left: 16.61 },
  },
  template7: {
    filename: "Template7.png",
    inset: { top: 21.55, right: 9.41, bottom: 26.25, left: 9.11 },
  },
};

const getBgPath = (filename: string): string => {
  const pathsToTry = [
    // 1. Development: src/app/utils/ -> src/app/assets/mockups/
    path.join(__dirname, "..", "assets", "mockups", filename),

    // 2. Production compiled: dist/app/utils/ -> src/app/assets/mockups/
    path.join(__dirname, "..", "..", "..", "src", "app", "assets", "mockups", filename),

    // 3. Relative to process.cwd() (src structure)
    path.join(process.cwd(), "src", "app", "assets", "mockups", filename),

    // 4. Relative to process.cwd() (dist structure)
    path.join(process.cwd(), "dist", "app", "assets", "mockups", filename),

    // 5. Fallback: direct app/assets/mockups
    path.join(process.cwd(), "app", "assets", "mockups", filename),
  ];

  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  const fallback = path.join(__dirname, "..", "assets", "mockups", filename);
  return fallback;
};

const generateSingleMockup = async (
  bannerBuffer: Buffer,
  config: MockupConfig
): Promise<Buffer> => {
  const bgPath = getBgPath(config.filename);
  if (!fs.existsSync(bgPath)) {
    throw new AppError(`Achtergrondafbeelding voor mockup niet gevonden: ${bgPath}`, 404);
  }

  const background = sharp(bgPath);
  const metadata = await background.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height) {
    throw new AppError(`Lezen van metadata mislukt voor ${config.filename}`, 500);
  }

  // Calculate overlay dimensions in pixels based on percentages
  const leftPx = Math.round((width * config.inset.left) / 100);
  const topPx = Math.round((height * config.inset.top) / 100);
  const rightPx = Math.round((width * config.inset.right) / 100);
  const bottomPx = Math.round((height * config.inset.bottom) / 100);

  const bannerWidth = width - leftPx - rightPx;
  const bannerHeight = height - topPx - bottomPx;

  // Resize banner using fill to stretch it exactly like the frontend
  const resizedBanner = await sharp(bannerBuffer)
    .resize(bannerWidth, bannerHeight, { fit: "fill" })
    .toBuffer();

  // Composite the banner onto the background
  const mockupBuffer = await background
    .composite([
      {
        input: resizedBanner,
        left: leftPx,
        top: topPx,
      },
    ])
    .png()
    .toBuffer();

  return mockupBuffer;
};

export interface GeneratedBusinessMockups {
  template1: Buffer;
  template2: Buffer;
  template3: Buffer;
  template4: Buffer;
  template5: Buffer;
  template6: Buffer;
  template7: Buffer;
}

export const generateBusinessMockups = async (
  bannerBuffer: Buffer
): Promise<GeneratedBusinessMockups> => {
  try {
    const template1 = await generateSingleMockup(bannerBuffer, businessMockupsConfig.template1);
    const template2 = await generateSingleMockup(bannerBuffer, businessMockupsConfig.template2);
    const template3 = await generateSingleMockup(bannerBuffer, businessMockupsConfig.template3);
    const template4 = await generateSingleMockup(bannerBuffer, businessMockupsConfig.template4);
    const template5 = await generateSingleMockup(bannerBuffer, businessMockupsConfig.template5);
    const template6 = await generateSingleMockup(bannerBuffer, businessMockupsConfig.template6);
    const template7 = await generateSingleMockup(bannerBuffer, businessMockupsConfig.template7);

    return {
      template1,
      template2,
      template3,
      template4,
      template5,
      template6,
      template7,
    };
  } catch (error: any) {
    throw new AppError(`Fout bij het genereren van business mockup: ${error.message}`, 500);
  }
};
