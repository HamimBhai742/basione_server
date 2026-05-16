import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3client";
type UploadInvoicePdfToS3Params = {
  pdfBuffer: Buffer;
  invoiceNumber: string;
};
export const uploadInvoicePdfToS3 = async ({
  pdfBuffer,
  invoiceNumber,
}: UploadInvoicePdfToS3Params) => {
  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET_NAME is missing in environment variables");
  }

  if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION is missing in environment variables");
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials are missing in environment variables");
  }

  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  const safeInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "-");
  const fileName = `${safeInvoiceNumber}.pdf`;
  const key = `invoices/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: pdfBuffer,
    ContentType: "application/pdf",
    ContentDisposition: `inline; filename="${fileName}"`,
  });

  await s3.send(command);

  const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

  return {
    fileName,
    key,
    fileUrl,
  };
};
