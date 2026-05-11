import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3client";
import config from "../../config";
import { AppError } from "../error/AppError";

export const uploadImageToS3 = async (file: Express.Multer.File) => {
  const bucketName = config.s3.name;
  const region = config.s3.region;

  if (!bucketName || !region) {
    throw new AppError("S3 bucket name or region is missing");
  }

  const safeFileName = file.originalname.replace(/\s+/g, "-");
  const fileName = `images/${Date.now()}-${safeFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

  return fileUrl;
};
