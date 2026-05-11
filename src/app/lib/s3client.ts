import { S3Client } from "@aws-sdk/client-s3";
import config from "../../config";

export const s3 = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.credentials.accessKeyId!,
    secretAccessKey: config.s3.credentials.secretAccessKey!,
  },
});
