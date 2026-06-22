import { prisma } from "../../lib/prisma";
import { AppError } from "../../error/AppError";

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

const getAllSvgMasks = async () => {
  const masks = await prisma.svgMask.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return masks;
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
  bindMaskToTemplate,
};
