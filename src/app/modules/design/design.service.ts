import { prisma } from "../../lib/prisma";

export enum ICategory {
  wedding = "wedding",
  birthday = "birthday",
  kids_party = "kids_party",
  baby_shower = "baby_shower",
  engagement = "engagement",
}

const createDesign = async (userId: string, payload: any) => {
  const design = await prisma.design.create({
    data: {
      ...payload,
      userId,
    },
  });
  return design;
};

const myDesign = async (id: string) => {
  const design = await prisma.design.findMany({
    where: {
      userId: id,
    },
  });
  return design;
};

const getAllDesigns = async (
  page: number,
  limit: number,
  skip: number,
  category?: ICategory,
) => {
  const designs = await prisma.design.findMany({
    skip,
    take: limit,
    where: {
      category: category ? category : undefined,
    },
  });

  const total = await prisma.design.count({
    where: {
      category: category ? category : undefined,
    },
  });
  return {
    designs,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const designService = {
  myDesign,
  createDesign,
  getAllDesigns,
};
