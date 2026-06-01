import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../error/AppError";
import { uploadFileToS3 } from "../../utils/uploadAws";
import { getS3KeyFromUrl } from "../../utils/getS3KeyFromUrl";
import { deleteImageFromS3 } from "../../utils/deleteImageFromS3";

type FontPayload = {
  name?: string;
  family?: string;
  sourceUrl?: string;
  isActive?: boolean | string;
};

const fontSelect = {
  id: true,
  name: true,
  family: true,
  sourceUrl: true,
  isActive: true,
};

const allowedFontExtensions = new Set(["ttf", "otf", "woff", "woff2"]);

const parseBoolean = (value: boolean | string | undefined) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return undefined;
};

const validateFontFile = (file: Express.Multer.File) => {
  const extension = file.originalname.split(".").pop()?.toLowerCase();

  if (!extension || !allowedFontExtensions.has(extension)) {
    throw new AppError(
      "Only .ttf, .otf, .woff, and .woff2 font files are allowed",
      httpStatus.BAD_REQUEST,
    );
  }
};

const getPublicFonts = async () => {
  return prisma.font.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: fontSelect,
  });
};

const getAdminFonts = async () => {
  return prisma.font.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: fontSelect,
  });
};

const createFont = async (
  payload: FontPayload,
  file?: Express.Multer.File,
) => {
  if (!payload.name || !payload.family) {
    throw new AppError("Font name and family are required", httpStatus.BAD_REQUEST);
  }

  let sourceUrl = payload.sourceUrl || "";

  if (file) {
    validateFontFile(file);
    sourceUrl = await uploadFileToS3(file, "fonts");
  }

  if (!sourceUrl) {
    throw new AppError("Font file or sourceUrl is required", httpStatus.BAD_REQUEST);
  }

  return prisma.font.create({
    data: {
      name: payload.name,
      family: payload.family,
      sourceUrl,
      isActive: parseBoolean(payload.isActive) ?? true,
    },
    select: fontSelect,
  });
};

const updateFont = async (
  id: string,
  payload: FontPayload,
  file?: Express.Multer.File,
) => {
  const font = await prisma.font.findUnique({
    where: {
      id,
    },
  });

  if (!font) {
    throw new AppError("Font not found", httpStatus.NOT_FOUND);
  }

  const data: {
    name?: string;
    family?: string;
    sourceUrl?: string;
    isActive?: boolean;
  } = {};

  if (payload.name !== undefined) data.name = payload.name;
  if (payload.family !== undefined) data.family = payload.family;

  const parsedIsActive = parseBoolean(payload.isActive);
  if (parsedIsActive !== undefined) data.isActive = parsedIsActive;

  if (payload.sourceUrl !== undefined) {
    data.sourceUrl = payload.sourceUrl;
  }

  if (file) {
    validateFontFile(file);
    data.sourceUrl = await uploadFileToS3(file, "fonts");

    const oldKey = getS3KeyFromUrl(font.sourceUrl);
    if (oldKey) {
      await deleteImageFromS3(oldKey);
    }
  }

  return prisma.font.update({
    where: {
      id,
    },
    data,
    select: fontSelect,
  });
};

const deleteFont = async (id: string) => {
  const font = await prisma.font.findUnique({
    where: {
      id,
    },
  });

  if (!font) {
    throw new AppError("Font not found", httpStatus.NOT_FOUND);
  }

  await prisma.font.delete({
    where: {
      id,
    },
  });

  const key = getS3KeyFromUrl(font.sourceUrl);
  if (key) {
    await deleteImageFromS3(key);
  }
};

export const fontService = {
  getPublicFonts,
  getAdminFonts,
  createFont,
  updateFont,
  deleteFont,
};
