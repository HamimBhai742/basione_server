import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";
import { AppError } from "../error/AppError";
import { uploadBufferToS3 } from "./uploadAws";

const getFontPath = (): string => {
  const pathsToTry = [
    // 1. Relative to __dirname in development (src/app/utils/ -> src/app/assets/fonts/)
    path.join(__dirname, "..", "assets", "fonts", "Roboto-Bold.ttf"),
    
    // 2. Relative to __dirname in production compiled (dist/app/utils/ -> src/app/assets/fonts/)
    path.join(__dirname, "..", "..", "..", "src", "app", "assets", "fonts", "Roboto-Bold.ttf"),
    
    // 3. Relative to process.cwd() in src
    path.join(process.cwd(), "src", "app", "assets", "fonts", "Roboto-Bold.ttf"),
    
    // 4. Relative to process.cwd() in dist
    path.join(process.cwd(), "dist", "app", "assets", "fonts", "Roboto-Bold.ttf"),

    // 5. In case they copied assets directly to root app/assets/fonts
    path.join(process.cwd(), "app", "assets", "fonts", "Roboto-Bold.ttf"),
  ];

  console.log(`[Font Discovery] process.cwd(): ${process.cwd()}`);
  console.log(`[Font Discovery] __dirname: ${__dirname}`);

  for (const p of pathsToTry) {
    const exists = fs.existsSync(p);
    console.log(`[Font Discovery] Checking path: ${p} - Exists: ${exists}`);
    if (exists) {
      console.log(`[Font Discovery] Successfully selected font path: ${p}`);
      return p.replace(/\\/g, "/");
    }
  }

  // Fallback to the default path if none exists
  const fallback = path.join(process.cwd(), "src", "app", "assets", "fonts", "Roboto-Bold.ttf").replace(/\\/g, "/");
  console.warn(`[Font Discovery] WARNING: Font not found in any standard location. Falling back to: ${fallback}`);
  return fallback;
};

const fontPath = getFontPath();

const escapeSvgText = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const getWatermarkSvg = ({
  text,
  width,
  height,
  widthCm,
  heightCm,
}: {
  text: string;
  width: number;
  height: number;
  widthCm?: number;
  heightCm?: number;
}) => {
  const physicalHeightCm = heightCm || 100;
  // 5mm = 0.5cm. Calculate corresponding pixel size.
  // fontSize = (0.5 / physicalHeightCm) * height
  const calculatedFontSize = Math.round((0.5 / physicalHeightCm) * height);
  const fontSize = Math.max(12, calculatedFontSize);

  const paddingX = Math.round(fontSize * 0.55);
  const paddingY = Math.round(fontSize * 0.35);
  const boxWidth = Math.round(text.length * fontSize * 0.64 + paddingX * 2);
  const boxHeight = Math.round(fontSize + paddingY * 2);
  const radius = Math.round(boxHeight * 0.18);

  return Buffer.from(`
    <svg width="${boxWidth}" height="${boxHeight}" viewBox="0 0 ${boxWidth} ${boxHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: 'Roboto-Bold';
            src: url('${fontPath}');
          }
          .watermark-text {
            font-family: 'Roboto-Bold', Arial, Helvetica, sans-serif;
            font-size: ${fontSize}px;
            font-weight: 700;
            fill: #0F172A;
          }
        </style>
      </defs>
      <rect x="0" y="0" width="${boxWidth}" height="${boxHeight}" rx="${radius}" fill="rgba(255,255,255,0.86)"/>
      <rect x="1" y="1" width="${boxWidth - 2}" height="${boxHeight - 2}" rx="${radius}" fill="none" stroke="rgba(15,23,42,0.35)" stroke-width="2"/>
      <text x="${boxWidth / 2}" y="${Math.round(boxHeight / 2 + fontSize * 0.35)}" text-anchor="middle" class="watermark-text">${escapeSvgText(text)}</text>
    </svg>
  `);
};

export const applyDesignNumberToBanner = async ({
  imageUrl,
  designNumber,
  widthCm,
  heightCm,
}: {
  imageUrl: string;
  designNumber: string;
  widthCm?: number;
  heightCm?: number;
}) => {
  if (!imageUrl) {
    throw new AppError("Banner image URL is missing", 400);
  }

  if (!designNumber) {
    throw new AppError("Design number is missing", 400);
  }

  const response = await axios.get<ArrayBuffer>(imageUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  });

  const image = sharp(Buffer.from(response.data)).rotate();
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new AppError("Unable to read banner image dimensions", 400);
  }

  const watermark = getWatermarkSvg({
    text: designNumber,
    width: metadata.width,
    height: metadata.height,
    widthCm,
    heightCm,
  });

  const watermarkMetadata = await sharp(watermark).metadata();
  const physicalHeightCm = heightCm || 100;
  // Approximately 8mm margin
  const margin = Math.max(
    10,
    Math.round((0.8 / physicalHeightCm) * metadata.height),
  );

  const finalImageBuffer = await image
    .composite([
      {
        input: watermark,
        left: Math.max(
          margin,
          metadata.width - Number(watermarkMetadata.width || 0) - margin,
        ),
        top: Math.max(
          margin,
          metadata.height - Number(watermarkMetadata.height || 0) - margin,
        ),
      },
    ])
    .png()
    .toBuffer();

  const key = `final-banners/${Date.now()}-${designNumber}.png`;

  return uploadBufferToS3({
    buffer: finalImageBuffer,
    key,
    contentType: "image/png",
  });
};
