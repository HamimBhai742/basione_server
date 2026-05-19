import { Request } from "express";
import { prisma } from "../../lib/prisma";
import axios from "axios";
import FormData from "form-data";
import { AppError } from "../../error/AppError";
import { uploadImageToS3 } from "../../utils/uploadAws";
import { getS3KeyFromUrl } from "../../utils/getS3KeyFromUrl";
import { deleteImageFromS3 } from "../../utils/deleteImageFromS3";
export enum ICategory {
  wedding = "wedding",
  birthday = "birthday",
  kids_party = "party",
  baby_shower = "baby_shower",
  engagement = "engagement",
}

type AuthRequest = Request & {
  user?: any;
  file?: Express.Multer.File;
};

const VAT_RATE = 0.21;

// Client confirmed: these prices are INCLUDING VAT
const MIN_PRICE_INCL_VAT = 12;
const PRICE_PER_M2_UNDER_1_INCL_VAT = 25;
const PRICE_PER_M2_FROM_1_INCL_VAT = 20;

const MAX_WIDTH_CM = 240;
const MAX_HEIGHT_CM = 160;

const calculateAreaM2 = (widthCm: number, heightCm: number) => {
  return (widthCm / 100) * (heightCm / 100);
};

const getPricePerM2InclVat = (areaM2: number) => {
  return areaM2 < 1
    ? PRICE_PER_M2_UNDER_1_INCL_VAT
    : PRICE_PER_M2_FROM_1_INCL_VAT;
};

const calculatePriceInclVat = (widthCm: number, heightCm: number) => {
  const areaM2 = calculateAreaM2(widthCm, heightCm);
  const pricePerM2InclVat = getPricePerM2InclVat(areaM2);
  const calculatedPrice = areaM2 * pricePerM2InclVat;

  return Math.max(calculatedPrice, MIN_PRICE_INCL_VAT);
};

const calculatePriceExclVat = (priceInclVat: number) => {
  return priceInclVat / (1 + VAT_RATE);
};

const calculateVatAmount = (priceInclVat: number) => {
  return priceInclVat - calculatePriceExclVat(priceInclVat);
};

const formatLabel = (text: string) => {
  return text
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const calculateBannerPriceInclVat = (widthCm: number, heightCm: number) => {
  const areaM2 = calculateAreaM2(widthCm, heightCm);
  const pricePerM2InclVat = getPricePerM2InclVat(areaM2);
  const calculatedPrice = areaM2 * pricePerM2InclVat;

  return roundToTwo(Math.max(calculatedPrice, MIN_PRICE_INCL_VAT));
};

const roundToTwo = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const createBanner = async (req: AuthRequest) => {
  const parsedData = req.body;

  const width = Number(parsedData?.size?.width);
  const height = Number(parsedData?.size?.height);

  if (
    Number.isNaN(width) ||
    Number.isNaN(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new AppError("Invalid banner size.", 400);
  }

  if (width > MAX_WIDTH_CM || height > MAX_HEIGHT_CM) {
    throw new AppError(
      `Maximum banner size is ${MAX_WIDTH_CM}cm × ${MAX_HEIGHT_CM}cm.`,
      400,
    );
  }

  /**
   * Price calculation
   * All prices are INCLUDING VAT.
   */
  const areaM2 = calculateAreaM2(width, height);
  const price = calculateBannerPriceInclVat(width, height);
  const priceExclVat = calculatePriceExclVat(price);
  const vatAmount = calculateVatAmount(price);
  const pricePerM2InclVat = getPricePerM2InclVat(areaM2);

  const formData = new FormData();

  formData.append(
    "data",
    JSON.stringify({
      occasion: parsedData?.occasion,
      style: parsedData?.style,
      headline: parsedData?.headline || "",
      subtext: parsedData?.subheadline || "",
      name: parsedData?.name || "",
      age: parsedData?.age || "",
      description:
        parsedData.description || "A banner for a wedding invitation",
    }),
  );

  if (req.file) {
    formData.append("ref_image_1", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
  }

  formData.append("ref_image_2", "");
  formData.append("ref_image_3", "");
  formData.append("ref_image_4", "");

  // const banners = await prisma.banner.findMany({
  //   take: 4,
  //   orderBy: { createdAt: "desc" },
  // });
  // return {
  //   variants: banners,
  // };

  const response = await axios.post(
    "https://ai.spandoekprint.nl/generate",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        accept: "application/json",
      },
      responseType: "stream",
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  if (response.status >= 400) {
    let rawError = "";

    await new Promise<void>((resolve, reject) => {
      response.data.on("data", (chunk: Buffer) => {
        rawError += chunk.toString("utf-8");
      });

      response.data.on("end", () => resolve());
      response.data.on("error", reject);
    });

    console.error("AI server error:", rawError);

    throw new AppError("AI server is shutting down", 400);
  }

  return new Promise((resolve, reject) => {
    const finalVariants: {
      variant: number;
      url: string | null;
      image_b64?: string | null;
      revised_prompt?: string;
    }[] = [];

    let buffer = "";
    let isFinished = false;

    const saveAndResolve = async () => {
      if (isFinished) return;

      isFinished = true;

      const sortedVariants = [...finalVariants].sort(
        (a, b) => a.variant - b.variant,
      );

      const savedBanners = await Promise.all(
        sortedVariants.map((item) =>
          prisma.banner.create({
            data: {
              userId: req.user?.id || null,

              occasion: parsedData.occasion,
              style: parsedData.style,
              headline: parsedData.headline,
              name: parsedData.name,

              hobbies: parsedData.hobbies || [],
              description: parsedData.description,

              sizeType: parsedData.size.type,
              sizeLabel: parsedData.size.label,
              width: parsedData.size.width,
              height: parsedData.size.height,

              imageUrl: item.url ?? "",
              variant: item.variant,

              price,

              revisedPrompt: item.revised_prompt || null,
            },
          }),
        ),
      );

      resolve({
        variants: savedBanners,

        /**
         * Optional response summary.
         * Useful for debugging/testing frontend.
         */
        pricing: {
          areaM2: roundToTwo(areaM2),
          pricePerM2InclVat,
          priceInclVat: price,
          priceExclVat,
          vatAmount,
          vatRate: VAT_RATE,
        },
      });
    };

    response.data.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf-8");
      buffer += text;

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const lines = part.split("\n");
        const dataLines: string[] = [];

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith("data:")) {
            dataLines.push(trimmedLine.replace("data:", "").trim());
          }
        }

        const dataStr = dataLines.join("");

        if (!dataStr) continue;

        let data: any;

        try {
          data = JSON.parse(dataStr);
        } catch {
          data = dataStr;
        }

        const event = data?.event?.trim?.();

        if (event === "final") {
          finalVariants.push({
            variant: data?.variant ?? null,
            url: data?.url ?? null,
            image_b64: data?.image_b64 ?? null,
            revised_prompt: data?.revised_prompt ?? "",
          });
        }

        if (event === "error") {
          if (!isFinished) {
            isFinished = true;

            reject(
              new AppError(data?.message || "AI server returned an error", 400),
            );
          }

          return;
        }

        if (event === "all_done") {
          saveAndResolve().catch((err) => {
            if (!isFinished) {
              isFinished = true;
              reject(err);
            }
          });

          return;
        }
      }
    });

    response.data.on("end", () => {
      saveAndResolve().catch((err) => {
        if (!isFinished) {
          isFinished = true;
          reject(err);
        }
      });
    });

    response.data.on("error", (err: Error) => {
      if (!isFinished) {
        isFinished = true;
        reject(err);
      }
    });
  });
};

const createBannerByTemplate = async (req: AuthRequest) => {
  const parsedData = JSON.parse(req?.body?.data);

  let occ = "";
  let headline = "";

  if (parsedData.size === "party-banner") {
    occ = "party";
    headline = "Welcome to the party";
  } else if (parsedData.size === "blessing-sign") {
    occ = "wedding";
    headline = "We are getting married";
  } else if (parsedData.size === "birthday-backdrop") {
    occ = "birthday";
    headline = "Happy birthday";
  } else {
    occ = "custom";
    headline = "Custom Banner";
  }

  const height = Number(parsedData.height);
  const width = Number(parsedData.width);

  if (
    Number.isNaN(width) ||
    Number.isNaN(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("Invalid banner width or height");
  }

  const areaM2 = calculateAreaM2(width, height);
  const pricePerM2InclVat = getPricePerM2InclVat(areaM2);

  // Final price is already INCLUDING VAT
  const priceInclVat = calculatePriceInclVat(width, height);
  const priceExclVat = calculatePriceExclVat(priceInclVat);
  const vatAmount = calculateVatAmount(priceInclVat);

  let imgUrl = "";

  if (req?.file) {
    const img = await uploadImageToS3(req.file);
    imgUrl = img;
  }

  const sizeLabel = formatLabel(parsedData.size);

  const banner = await prisma.banner.create({
    data: {
      headline,
      occasion: occ,
      imageUrl: imgUrl,

      // Main price field should store VAT-included final price
      price: Number(priceInclVat.toFixed(2)),

      width,
      height,
      sizeType: parsedData.size,
      sizeLabel,
      style: "Template",
      variant: 0,

      // Uncomment these only if these fields exist in your Prisma schema
      // areaM2: Number(areaM2.toFixed(2)),
      // pricePerM2: Number(pricePerM2InclVat.toFixed(2)),
      // priceInclVat: Number(priceInclVat.toFixed(2)),
      // priceExclVat: Number(priceExclVat.toFixed(2)),
      // vatAmount: Number(vatAmount.toFixed(2)),
      // vatRate: VAT_RATE,
      // isVatIncluded: true,
    },
  });

  return banner;
};

const updateBanner = async (req: AuthRequest, bannerId: string) => {
  const banner = await prisma.banner.findUnique({
    where: {
      id: bannerId,
    },
  });

  if (!banner) {
    throw new Error("Banner not found");
  }

  let parsedData: any = null;

  if (req?.body?.data) {
    parsedData =
      typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body.data;
  }

  let occasion = banner.occasion;
  let headline = banner.headline;

  if (parsedData?.size === "party-banner") {
    occasion = "party";
    headline = "Welcome to the party";
  } else if (parsedData?.size === "blessing-sign") {
    occasion = "wedding";
    headline = "We are getting married";
  } else if (parsedData?.size === "birthday-backdrop") {
    occasion = "birthday";
    headline = `Happy birthday ${banner.name || ""}`.trim();
  }

  const width = parsedData?.width
    ? Number(parsedData.width)
    : Number(banner.width);
  const height = parsedData?.height
    ? Number(parsedData.height)
    : Number(banner.height);

  let price = banner.price;

  let areaM2 = 0;
  let pricePerM2InclVat = 0;
  let priceInclVat = Number(banner.price);
  let priceExclVat = 0;
  let vatAmount = 0;

  if (parsedData?.width && parsedData?.height) {
    if (
      Number.isNaN(width) ||
      Number.isNaN(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error("Invalid banner width or height");
    }

    areaM2 = calculateAreaM2(width, height);
    pricePerM2InclVat = getPricePerM2InclVat(areaM2);

    // Final price is already INCLUDING VAT
    priceInclVat = calculatePriceInclVat(width, height);
    priceExclVat = calculatePriceExclVat(priceInclVat);
    vatAmount = calculateVatAmount(priceInclVat);

    price = Number(priceInclVat.toFixed(2));
  }

  let imageUrl = banner?.imageUrl;
  const oldImg = banner?.imageUrl;

  if (req?.file) {
    const img = await uploadImageToS3(req.file);
    imageUrl = img;

    if (oldImg) {
      const oldKey = getS3KeyFromUrl(oldImg);

      if (oldKey) {
        await deleteImageFromS3(oldKey);
      }
    }
  }

  const updateData: any = {};

  if (imageUrl) {
    updateData.imageUrl = imageUrl;
  }

  if (parsedData?.size) {
    updateData.headline = headline;
    updateData.occasion = occasion;
    updateData.price = price;
    updateData.sizeType = parsedData.size;
    updateData.sizeLabel = formatLabel(parsedData.size);
  }

  if (parsedData?.width) {
    updateData.width = width;
  }

  if (parsedData?.height) {
    updateData.height = height;
  }

  // Uncomment only if these fields exist in your Prisma schema
  // if (parsedData?.width && parsedData?.height) {
  //   updateData.areaM2 = Number(areaM2.toFixed(2));
  //   updateData.pricePerM2 = Number(pricePerM2InclVat.toFixed(2));
  //   updateData.priceInclVat = Number(priceInclVat.toFixed(2));
  //   updateData.priceExclVat = Number(priceExclVat.toFixed(2));
  //   updateData.vatAmount = Number(vatAmount.toFixed(2));
  //   updateData.vatRate = VAT_RATE;
  //   updateData.isVatIncluded = true;
  // }

  const updatedBanner = await prisma.banner.update({
    where: {
      id: bannerId,
    },
    data: updateData,
  });

  return updatedBanner;
};

const mybanner = async (id: string) => {
  const banner = await prisma.banner.findMany({
    where: {
      userId: id,
    },
  });
  return banner;
};

const getAllbanners = async (
  page: number,
  limit: number,
  skip: number,
  category?: string,
  fetchFrom?: "home" | "gallery",
) => {
  const banners = await prisma.banner.findMany({
    skip,
    take: fetchFrom === "home" ? 6 : limit,
    where: {
      occasion: category ? category : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.banner.count({
    where: {
      occasion: category ? category : undefined,
    },
  });

  return {
    banners,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSelectedBanner = async (id: string) => {
  await prisma.banner.update({
    where: {
      id,
    },
    data: {
      isSelected: true,
      status: "SELECTED",
    },
  });
  const banner = await prisma.banner.findUnique({
    where: {
      id,
    },
  });
  return banner;
};

const getTemplates = async (
  page: number,
  limit: number,
  skip: number,
  occasion?: string,
) => {
  const where: any = {
    isTemplate: true,
  };

  if (occasion) {
    where.occasion = occasion;
  }

  const templates = await prisma.banner.findMany({
    skip,
    take: limit,
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.banner.count({ where });

  return {
    templates,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createBannerFromTemplate = async (req: AuthRequest) => {
  let parsedData = req.body;
  if (typeof req.body === "string" || (req.body.data && typeof req.body.data === "string")) {
    parsedData = JSON.parse(req.body.data || req.body);
  }

  const { templateId } = parsedData;
  if (!templateId) {
    throw new AppError("templateId is required", 400);
  }

  const template = await prisma.banner.findUnique({
    where: { id: templateId, isTemplate: true },
  });

  if (!template) {
    throw new AppError("Template not found", 404);
  }

  const width = Number(parsedData.width);
  const height = Number(parsedData.height);

  if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
    throw new AppError("Invalid banner size.", 400);
  }

  if (width > MAX_WIDTH_CM || height > MAX_HEIGHT_CM) {
    throw new AppError(
      `Maximum banner size is ${MAX_WIDTH_CM}cm × ${MAX_HEIGHT_CM}cm.`,
      400,
    );
  }

  const price = calculateBannerPriceInclVat(width, height);

  let imageUrl = template.imageUrl;
  if (req.file) {
    imageUrl = await uploadImageToS3(req.file);
  }

  const sizeType = parsedData.sizeType || template.sizeType;
  const sizeLabel = formatLabel(sizeType);

  const banner = await prisma.banner.create({
    data: {
      userId: req.user?.id || null,
      occasion: template.occasion,
      style: template.style,
      headline: parsedData.headline || template.headline,
      name: parsedData.name || template.name,
      description: parsedData.description || template.description,
      hobbies: parsedData.hobbies || template.hobbies || [],
      sizeType,
      sizeLabel,
      width,
      height,
      imageUrl,
      price,
      variant: 0,
      isTemplate: false,
      isSelected: true,
      status: "SELECTED",
    },
  });

  return banner;
};

export const bannerService = {
  mybanner,
  createBanner,
  getAllbanners,
  getSelectedBanner,
  createBannerByTemplate,
  updateBanner,
  getTemplates,
  createBannerFromTemplate,
};
