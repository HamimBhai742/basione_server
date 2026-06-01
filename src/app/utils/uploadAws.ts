import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3client";
import config from "../../config";
import { AppError } from "../error/AppError";

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
