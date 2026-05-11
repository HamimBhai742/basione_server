import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3client";
import config from "../../config";

export const deleteImageFromS3 = async (key: string) => {
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: config.s3.name!,
    Key: key,
  });

  await s3.send(command);
};