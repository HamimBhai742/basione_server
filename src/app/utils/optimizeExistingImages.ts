import "dotenv/config";
import { prisma } from "../lib/prisma";
import { uploadBufferToS3 } from "./uploadAws";
import { optimizeImage } from "./optimizeImage";
import axios from "axios";
import path from "path";

// Helper to fetch file buffer from URL
const downloadImageBuffer = async (url: string): Promise<Buffer | null> => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error(`Failed to download image from ${url}:`, error.message);
    return null;
  }
};

// Helper to check if URL is SVG
const isSvg = (url: string): boolean => {
  return url.toLowerCase().endsWith(".svg") || url.includes(".svg?");
};

// Helper to check if URL is already optimized
const isAlreadyOptimized = (url: string): boolean => {
  return url.includes("/optimized-") || url.includes("optimized-");
};

// Extract filename from URL to keep clean names
const getFileNameFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    return path.basename(pathname);
  } catch {
    return `image-${Date.now()}.jpg`;
  }
};

async function main() {
  // console.log("=== Starting Website-wide Image Optimization Migration ===");

  // 1. Optimize Templates (Banners where isTemplate is true or isReadymade is true)
  // console.log("\n--- Processing Templates (Banners) ---");
  const banners = await prisma.banner.findMany({
    where: {
      OR: [
        { isTemplate: true },
        { isReadymade: true }
      ]
    }
  });
  // console.log(`Found ${banners.length} templates/readymades.`);

  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    const imageUrl = banner.imageUrl;
    
    if (!imageUrl || isSvg(imageUrl)) {
      // console.log(`[${i+1}/${banners.length}] Skipping banner ID ${banner.id}: No image or SVG.`);
      continue;
    }

    const sourceUrl = banner.originalImageUrl || imageUrl;
    
    // Copy imageUrl to originalImageUrl if it was not set
    if (!banner.originalImageUrl) {
      await prisma.banner.update({
        where: { id: banner.id },
        data: { originalImageUrl: imageUrl }
      });
      // console.log(`[${i+1}/${banners.length}] Initialized originalImageUrl for banner ID ${banner.id}`);
    }

    if (isAlreadyOptimized(imageUrl)) {
      // console.log(`[${i+1}/${banners.length}] Skipping banner ID ${banner.id}: already optimized.`);
      continue;
    }

    // console.log(`[${i+1}/${banners.length}] Optimizing banner ID ${banner.id} (URL: ${sourceUrl})`);
    const buffer = await downloadImageBuffer(sourceUrl);
    if (!buffer) continue;

    try {
      const optimized = await optimizeImage(buffer, 1600, 1600, 80);
      const cleanName = getFileNameFromUrl(sourceUrl);
      const key = `images/optimized-${Date.now()}-${cleanName}`;
      
      const newUrl = await uploadBufferToS3({
        buffer: optimized,
        key,
        contentType: "image/jpeg"
      });

      await prisma.banner.update({
        where: { id: banner.id },
        data: { imageUrl: newUrl }
      });
      // console.log(`>> Successfully optimized banner ID ${banner.id}. New URL: ${newUrl}`);
    } catch (err: any) {
      console.error(`>> Failed to optimize banner ID ${banner.id}:`, err.message);
    }
  }

  // 2. Optimize Decorations
  // console.log("\n--- Processing Decorations ---");
  const decorations = await prisma.decoration.findMany();
  // console.log(`Found ${decorations.length} decorations.`);

  for (let i = 0; i < decorations.length; i++) {
    const dec = decorations[i];
    const imageUrl = dec.image;

    if (!imageUrl || isSvg(imageUrl)) {
      // console.log(`[${i+1}/${decorations.length}] Skipping decoration ID ${dec.id}: No image or SVG.`);
      continue;
    }

    if (isAlreadyOptimized(imageUrl)) {
      // console.log(`[${i+1}/${decorations.length}] Skipping decoration ID ${dec.id}: already optimized.`);
      continue;
    }

    // console.log(`[${i+1}/${decorations.length}] Optimizing decoration ID ${dec.id} (URL: ${imageUrl})`);
    const buffer = await downloadImageBuffer(imageUrl);
    if (!buffer) continue;

    try {
      const optimized = await optimizeImage(buffer, 1200, 1200, 80);
      const cleanName = getFileNameFromUrl(imageUrl);
      const key = `images/optimized-${Date.now()}-${cleanName}`;

      const newUrl = await uploadBufferToS3({
        buffer: optimized,
        key,
        contentType: "image/jpeg"
      });

      await prisma.decoration.update({
        where: { id: dec.id },
        data: { image: newUrl }
      });
      // console.log(`>> Successfully optimized decoration ID ${dec.id}. New URL: ${newUrl}`);
    } catch (err: any) {
      console.error(`>> Failed to optimize decoration ID ${dec.id}:`, err.message);
    }
  }

  // 3. Optimize Blogs
  // console.log("\n--- Processing Blogs ---");
  const blogs = await prisma.blog.findMany();
  // console.log(`Found ${blogs.length} blog posts.`);

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    
    // Cover Image
    if (blog.coverImage && !isSvg(blog.coverImage) && !isAlreadyOptimized(blog.coverImage)) {
      // console.log(`[Blog ${i+1}/${blogs.length}] Optimizing cover image for blog ID ${blog.id}`);
      const buffer = await downloadImageBuffer(blog.coverImage);
      if (buffer) {
        try {
          const optimized = await optimizeImage(buffer, 1600, 1600, 80);
          const cleanName = getFileNameFromUrl(blog.coverImage);
          const key = `images/optimized-${Date.now()}-${cleanName}`;
          
          const newUrl = await uploadBufferToS3({
            buffer: optimized,
            key,
            contentType: "image/jpeg"
          });

          await prisma.blog.update({
            where: { id: blog.id },
            data: { coverImage: newUrl }
          });
          // console.log(`>> Successfully optimized blog cover. New URL: ${newUrl}`);
        } catch (err: any) {
          console.error(`>> Failed to optimize blog cover:`, err.message);
        }
      }
    }

    // Inline Blog Images
    if (blog.images && blog.images.length > 0) {
      const updatedImages = [...blog.images];
      let hasUpdates = false;

      for (let j = 0; j < blog.images.length; j++) {
        const img = blog.images[j];
        if (img && !isSvg(img) && !isAlreadyOptimized(img)) {
          // console.log(`[Blog ${i+1}/${blogs.length} - Image ${j+1}/${blog.images.length}] Optimizing inline image`);
          const buffer = await downloadImageBuffer(img);
          if (buffer) {
            try {
              const optimized = await optimizeImage(buffer, 1600, 1600, 80);
              const cleanName = getFileNameFromUrl(img);
              const key = `images/optimized-${Date.now()}-${cleanName}`;

              const newUrl = await uploadBufferToS3({
                buffer: optimized,
                key,
                contentType: "image/jpeg"
              });

              updatedImages[j] = newUrl;
              hasUpdates = true;
              // console.log(`>> Optimized inline image ${j+1}. New URL: ${newUrl}`);
            } catch (err: any) {
              console.error(`>> Failed to optimize inline image:`, err.message);
            }
          }
        }
      }

      if (hasUpdates) {
        await prisma.blog.update({
          where: { id: blog.id },
          data: { images: updatedImages }
        });
        // console.log(`>> Successfully updated blog ID ${blog.id} inline images in DB.`);
      }
    }
  }

  // 4. Optimize User Profiles
  // console.log("\n--- Processing Users ---");
  const users = await prisma.user.findMany({
    where: {
      image: {
        not: null
      }
    }
  });
  // console.log(`Found ${users.length} users with profile pictures.`);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const imageUrl = user.image;

    if (!imageUrl || isSvg(imageUrl) || isAlreadyOptimized(imageUrl)) {
      continue;
    }

    // console.log(`[${i+1}/${users.length}] Optimizing avatar for user ID ${user.id}`);
    const buffer = await downloadImageBuffer(imageUrl);
    if (!buffer) continue;

    try {
      const optimized = await optimizeImage(buffer, 400, 400, 85);
      const cleanName = getFileNameFromUrl(imageUrl);
      const key = `images/optimized-${Date.now()}-${cleanName}`;

      const newUrl = await uploadBufferToS3({
        buffer: optimized,
        key,
        contentType: "image/jpeg"
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { image: newUrl }
      });
      // console.log(`>> Successfully optimized avatar for user ID ${user.id}. New URL: ${newUrl}`);
    } catch (err: any) {
      console.error(`>> Failed to optimize user avatar:`, err.message);
    }
  }

  // 5. Optimize Background Images
  // console.log("\n--- Processing Background Images ---");
  const backgroundImages = await prisma.backgroundImage.findMany();
  // console.log(`Found ${backgroundImages.length} background images.`);

  for (let i = 0; i < backgroundImages.length; i++) {
    const bg = backgroundImages[i];
    const imageUrl = bg.imageUrl;

    if (!imageUrl || isSvg(imageUrl) || isAlreadyOptimized(imageUrl)) {
      continue;
    }

    // console.log(`[${i+1}/${backgroundImages.length}] Optimizing background image ID ${bg.id}`);
    const buffer = await downloadImageBuffer(imageUrl);
    if (!buffer) continue;

    try {
      const optimized = await optimizeImage(buffer, 1600, 1600, 80);
      const cleanName = getFileNameFromUrl(imageUrl);
      const key = `images/optimized-${Date.now()}-${cleanName}`;

      const newUrl = await uploadBufferToS3({
        buffer: optimized,
        key,
        contentType: "image/jpeg"
      });

      await prisma.backgroundImage.update({
        where: { id: bg.id },
        data: { imageUrl: newUrl }
      });
      // console.log(`>> Successfully optimized background image ID ${bg.id}. New URL: ${newUrl}`);
    } catch (err: any) {
      console.error(`>> Failed to optimize background image:`, err.message);
    }
  }

  // console.log("\n=== Image Optimization Migration Script Finished Successfully ===");
}

main()
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
