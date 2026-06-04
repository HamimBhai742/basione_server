import { prisma } from "../../lib/prisma";

const getAllDecoration = async (
  page: number,
  limit: number,
  skip: number,
  filter: any,
  sortBy: string,
  sortOrder: "asc" | "desc",
) => {
  const decorations = await prisma.decoration.findMany({
    where: filter && Object.keys(filter).length > 0 ? filter : undefined,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      category: true,
    }
  });
  
  return {
    decorations,
    metaData: {
      page,
      limit,
      total: decorations?.length,
      totalPages: Math.ceil(decorations?.length / limit),
    },
  };
};


export const decorationService = {
  getAllDecoration,
};