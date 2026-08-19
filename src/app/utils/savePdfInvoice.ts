import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3client";
import { AppError } from "../error/AppError";
import config from "../../config";
type UploadInvoicePdfToS3Params = {
  pdfBuffer: Buffer;
  invoiceNumber: string;
};
export const uploadInvoicePdfToS3 = async ({
  pdfBuffer,
  invoiceNumber,
}: UploadInvoicePdfToS3Params) => {
  if (!config.s3.name) {
    throw new AppError(
      "AWS_S3_BUCKET_NAME ontbreekt in omgevingsvariabelen",
    );
  }

  if (!config.s3.region) {
    throw new AppError("AWS_REGION ontbreekt in omgevingsvariabelen");
  }

  if (!config.s3.credentials.accessKeyId) {
    throw new AppError("AWS-inloggegevens ontbreken in omgevingsvariabelen");
  }

  const bucketName = config.s3.name;
  const region = config.s3.region;

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
