import { uploadBufferToS3 } from "./uploadAws";
import { AppError } from "../error/AppError";
import httpStatus from "http-status";

const mimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Checks if a string is a valid HTTP/HTTPS URL.
 */
export const isUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

/**
 * Uploads a base64 string (either data URI or raw base64) to S3, or returns the string if it is already a URL.
 * 
 * @param input The base64 string or URL.
 * @param folder The target S3 folder prefix.
 * @param defaultContentType Default mime type if raw base64 is passed.
 * @returns The resolved S3 URL.
 */
export const uploadBase64OrUrl = async (
  input: string | undefined | null,
  folder: string = "images",
  defaultContentType: string = "image/jpeg"
): Promise<string | undefined> => {
  if (!input) {
    return undefined;
  }

  // If it's already a URL, return it directly
  if (isUrl(input)) {
    return input;
  }

  try {
    let contentType = defaultContentType;
    let base64Data = input;

    // Check if it's a data URI scheme
    const matches = input.match(/^data:(.*?);base64,(.*)$/);
    if (matches) {
      contentType = matches[1];
      base64Data = matches[2];
    } else {
      // Basic validation for raw base64 (should not contain spaces, etc.)
      const isBase64 = /^[a-zA-Z0-9+/]*={0,2}$/.test(input.replace(/\s/g, ""));
      if (!isBase64) {
        throw new AppError("Invalid input: neither a valid URL nor a valid Base64 string", httpStatus.BAD_REQUEST);
      }
    }

    const buffer = Buffer.from(base64Data, "base64");
    const ext = mimeToExt[contentType] || "bin";
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const key = `${folder}/ext-${Date.now()}-${uniqueId}.${ext}`;

    const s3Url = await uploadBufferToS3({
      buffer,
      key,
      contentType,
    });

    return s3Url;
  } catch (error: any) {
    throw new AppError(
      `Failed to process and upload asset: ${error.message || error}`,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};
