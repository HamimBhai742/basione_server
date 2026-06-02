import path from "path";
import axios from "axios";
import sharp from "sharp";
import { AppError } from "../error/AppError";
import { uploadBufferToS3 } from "./uploadAws";

const fontPath = path.join(process.cwd(), "src", "app", "assets", "fonts", "Roboto-Bold.ttf").replace(/\\/g, "/");

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
}: {
  text: string;
  width: number;
  height: number;
}) => {
  const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.035));
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
}: {
  imageUrl: string;
  designNumber: string;
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
  });

  const watermarkMetadata = await sharp(watermark).metadata();
  const margin = Math.max(
    16,
    Math.round(Math.min(metadata.width, metadata.height) * 0.018),
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
