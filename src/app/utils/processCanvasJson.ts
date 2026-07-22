import { uploadBufferToS3 } from "./uploadAws";

/**
 * Extracts extension and MIME type from a Data URL header.
 * e.g. "data:image/png;base64," -> { mimeType: "image/png", ext: "png" }
 */
const parseDataUrlHeader = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,/i);
  if (!match) {
    return { mimeType: "image/png", ext: "png" };
  }

  const mimeType = match[1].toLowerCase();
  let ext = "png";

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    ext = "jpg";
  } else if (mimeType.includes("webp")) {
    ext = "webp";
  } else if (mimeType.includes("svg")) {
    ext = "svg";
  } else if (mimeType.includes("gif")) {
    ext = "gif";
  }

  return { mimeType, ext };
};

/**
 * Processes a canvasJSON string or object:
 * 1. Scans for any embedded Base64 image Data URLs (data:image/...;base64,...).
 * 2. Uploads each embedded image to AWS S3.
 * 3. Replaces the Base64 Data URL with the uploaded S3 URL.
 * 4. Returns the cleaned canvasJSON string.
 */
export const processCanvasJsonImages = async (
  canvasJsonInput: any,
): Promise<string | null> => {
  if (canvasJsonInput === null || canvasJsonInput === undefined) {
    return null;
  }

  let rawString =
    typeof canvasJsonInput === "string"
      ? canvasJsonInput
      : JSON.stringify(canvasJsonInput);

  if (!rawString || !rawString.includes("data:image/")) {
    return rawString;
  }

  // Regex to match data:image Data URLs (capturing the full data URL)
  const base64Regex = /"data:image\/[a-zA-Z0-9\+\-\.]+;base64,[A-Za-z0-9+/=]+"/g;
  const matches = rawString.match(base64Regex);

  if (!matches || matches.length === 0) {
    return rawString;
  }

  // Deduplicate matched Base64 strings to avoid uploading identical images multiple times
  const uniqueBase64Strings = Array.from(new Set(matches));

  const replacements: Record<string, string> = {};

  await Promise.all(
    uniqueBase64Strings.map(async (quotedDataUrl) => {
      try {
        // Strip leading and trailing quotes
        const dataUrl = quotedDataUrl.slice(1, -1);
        const commaIndex = dataUrl.indexOf(",");
        if (commaIndex === -1) return;

        const header = dataUrl.substring(0, commaIndex + 1);
        const base64Data = dataUrl.substring(commaIndex + 1);

        const { mimeType, ext } = parseDataUrlHeader(header);
        const buffer = Buffer.from(base64Data, "base64");

        const key = `canvas-assets/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

        const s3Url = await uploadBufferToS3({
          buffer,
          key,
          contentType: mimeType,
        });

        // Store quoted replacement string
        replacements[originalQuotedKey(quotedDataUrl)] = `"${s3Url}"`;
      } catch (err) {
        console.error("Failed to upload canvas Base64 image to S3:", err);
      }
    }),
  );

  function originalQuotedKey(q: string) {
    return q;
  }

  for (const [originalQuoted, replacementQuoted] of Object.entries(replacements)) {
    rawString = rawString.split(originalQuoted).join(replacementQuoted);
  }

  return rawString;
};
