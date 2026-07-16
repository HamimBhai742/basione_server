import sharp from "sharp";

/**
 * Optimizes an image buffer (JPEG/PNG) to a web-optimized JPEG format.
 * Resizes the image to fit within a 1600x1600 bounding box, preserves
 * aspect ratio, handles EXIF rotation, and compresses the output.
 * 
 * @param buffer The original raw file buffer
 * @returns Optimized image buffer
 */
export const optimizeImage = async (
  buffer: Buffer,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 80,
): Promise<Buffer> => {
  return sharp(buffer)
    .rotate() // Automatic rotation based on EXIF metadata
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality,
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer();
};
