import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3client";
import config from "../../config";
import { AppError } from "../error/AppError";
import { optimizeImage } from "./optimizeImage";

const getPublicS3Url = (bucketName: string, region: string, key: string) => {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
};

export const uploadFileToS3 = async (
  file: Express.Multer.File,
  folder = "images",
) => {
  const bucketName = config.s3.name;
  const region = config.s3.region;

  if (!bucketName || !region) {
    throw new AppError("S3 bucket name or region is missing");
  }

  const safeFileName = file.originalname.replace(/\s+/g, "-");
  const fileName = `${folder}/${Date.now()}-${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return getPublicS3Url(bucketName, region, fileName);
};

export const uploadImageToS3 = async (file: Express.Multer.File) => {
  return uploadFileToS3(file, "images");
};

export const uploadBufferToS3 = async ({
  buffer,
  key,
  contentType,
}: {
  buffer: Buffer;
  key: string;
  contentType: string;
}) => {
  const bucketName = config.s3.name;
  const region = config.s3.region;

  if (!bucketName || !region) {
    throw new AppError("S3 bucket name or region is missing");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  return getPublicS3Url(bucketName, region, key);
};

export const uploadOptimizedImageToS3 = async (
  file: Express.Multer.File,
  folder = "images",
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 80,
) => {
  // SVG, PNG, WebP and non-image files are uploaded directly to preserve transparency and alpha channels
  if (
    file.mimetype === "image/svg+xml" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp" ||
    !file.mimetype.startsWith("image/")
  ) {
    return uploadFileToS3(file, folder);
  }

  try {
    const optimizedBuffer = await optimizeImage(file.buffer, maxWidth, maxHeight, quality);
    const safeFileName = file.originalname.replace(/\s+/g, "-");
    const fileName = `${folder}/optimized-${Date.now()}-${safeFileName}`;

    return uploadBufferToS3({
      buffer: optimizedBuffer,
      key: fileName,
      contentType: "image/jpeg", // optimizeImage converts output to progressive jpeg
    });
  } catch (err) {
    console.error("Failed to optimize image, uploading original instead:", err);
    return uploadFileToS3(file, folder);
  }
};
