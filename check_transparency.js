const sharp = require("sharp");

const run = async () => {
  const logoPath = "c:/Projects/basione-client/public/logo.png";
  try {
    const image = sharp(logoPath);
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        const a = data[idx+3];

        // Content pixel: transparent alpha = 0 is background, and pure white (R>245, G>245, B>245) is also background.
        // We only care about non-transparent, non-white pixels.
        const isBackground = a < 50 || (r > 245 && g > 245 && b > 245);
        if (!isBackground) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    console.log(`True content bounding box (excluding white/transparent):`);
    console.log(`left=${minX}, top=${minY}, right=${maxX}, bottom=${maxY}`);
    console.log(`True size: ${maxX - minX + 1} x ${maxY - minY + 1}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
};

run();
