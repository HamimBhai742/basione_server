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

const mockupsConfig: Record<string, MockupConfig> = {
  first: {
    filename: "first.png",
    inset: { top: 26.40, right: 8.77, bottom: 28.31, left: 9.01 },
  },
  hedge: {
    filename: "3074128C-630F-4063-BC25-586F28454255.png",
    inset: { top: 28.98, right: 17.22, bottom: 33.83, left: 18.26 },
  },
  party: {
    filename: "7DF04721-9255-404D-8314-4C72A00DDB39.png",
    inset: { top: 19.43, right: 21.49, bottom: 33.37, left: 20.72 },
  },
  railing: {
    filename: "D50DE860-4EA9-4E72-8AA6-232607B217C4.png",
    inset: { top: 41.23, right: 21.61, bottom: 29.51, left: 20.57 },
  },
  lawnNew: {
    filename: "EA913469-0371-4A84-AFBB-C79BB7938461.png",
    inset: { top: 28.87, right: 21.53, bottom: 34.65, left: 21.69 },
  },
  garden: {
    filename: "garden_bg.png",
    inset: { top: 6.27, right: 8.22, bottom: 36.50, left: 8.92 },
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
    throw new AppError(`Mockup background image not found: ${bgPath}`, 404);
  }

  const background = sharp(bgPath);
  const metadata = await background.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height) {
    throw new AppError(`Failed to read metadata for ${config.filename}`, 500);
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

export interface GeneratedMockups {
  first: Buffer;
  hedge: Buffer;
  party: Buffer;
  railing: Buffer;
  lawnNew: Buffer;
  garden: Buffer;
}

export const generateAllMockups = async (
  bannerBuffer: Buffer
): Promise<GeneratedMockups> => {
  try {
    const first = await generateSingleMockup(bannerBuffer, mockupsConfig.first);
    const hedge = await generateSingleMockup(bannerBuffer, mockupsConfig.hedge);
    const party = await generateSingleMockup(bannerBuffer, mockupsConfig.party);
    const railing = await generateSingleMockup(bannerBuffer, mockupsConfig.railing);
    const lawnNew = await generateSingleMockup(bannerBuffer, mockupsConfig.lawnNew);
    const garden = await generateSingleMockup(bannerBuffer, mockupsConfig.garden);

    return {
      first,
      hedge,
      party,
      railing,
      lawnNew,
      garden,
    };
  } catch (error: any) {
    throw new AppError(`Fout bij het genereren van all mockups: ${error.message}`, 500);
  }
};
