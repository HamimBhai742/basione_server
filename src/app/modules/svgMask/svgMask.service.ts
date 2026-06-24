import { prisma } from "../../lib/prisma";
import { AppError } from "../../error/AppError";
import { getS3KeyFromUrl } from "../../utils/getS3KeyFromUrl";
import { deleteImageFromS3 } from "../../utils/deleteImageFromS3";

const createSvgMask = async (name: string, svgUrl: string) => {
  if (!name || !svgUrl) {
    throw new AppError("Mask name and SVG URL are required", 400);
  }

  const newMask = await prisma.svgMask.create({
    data: {
      name,
      svgUrl,
    },
  });

  return newMask;
};

const getAllSvgMasks = async (page?: number, limit?: number) => {
  if (page === undefined || limit === undefined) {
    const masks = await prisma.svgMask.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return {
      masks,
      metaData: {
        total: masks.length,
        page: 1,
        limit: masks.length,
        totalPages: 1,
      },
    };
  }

  const skip = (page - 1) * limit;
  const masks = await prisma.svgMask.findMany({
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  const total = await prisma.svgMask.count();

  return {
    masks,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const deleteSvgMask = async (id: string) => {
  const mask = await prisma.svgMask.findUnique({
    where: { id },
  });

  if (!mask) {
    throw new AppError("SVG Mask not found", 404);
  }

  // Check if it's bound to any template first
  const boundCount = await prisma.banner.count({
    where: { svgMaskId: id },
  });

  if (boundCount > 0) {
    throw new AppError("This SVG Mask is currently bound to templates and cannot be deleted", 400);
  }

  // Delete from S3
  const key = getS3KeyFromUrl(mask.svgUrl);
  if (key) {
    try {
      await deleteImageFromS3(key);
    } catch (err) {
      console.error("Failed to delete SVG Mask from S3:", err);
    }
  }

  // Delete from DB
  await prisma.svgMask.delete({
    where: { id },
  });

  return true;
};

const bindMaskToTemplate = async (templateId: string, svgMaskId: string | null) => {
  if (!templateId) {
    throw new AppError("Template ID is required", 400);
  }

  // Verify template exists
  const template = await prisma.banner.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new AppError("Template not found", 404);
  }

  // Verify mask exists if binding
  if (svgMaskId) {
    const mask = await prisma.svgMask.findUnique({
      where: { id: svgMaskId },
    });
    if (!mask) {
      throw new AppError("SVG Mask not found", 404);
    }
  }

  const updatedTemplate = await prisma.banner.update({
    where: { id: templateId },
    data: {
      svgMaskId: svgMaskId || null,
    },
    include: {
      svgMask: true,
    },
  });

  return updatedTemplate;
};

export const svgMaskService = {
  createSvgMask,
  getAllSvgMasks,
  deleteSvgMask,
  bindMaskToTemplate,
};
