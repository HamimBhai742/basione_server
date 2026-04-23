import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3client";

export const uploadImageToS3 = async (file: Express.Multer.File) => {
  const fileName = `images/${Date.now()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;

  return fileUrl;
};
