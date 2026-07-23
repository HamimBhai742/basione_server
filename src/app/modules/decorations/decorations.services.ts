import { prisma } from "../../lib/prisma";

const getAllDecoration = async (
  page: number,
  limit: number,
  skip: number,
  filter: any,
  sortBy: string,
  sortOrder: "asc" | "desc",
) => {
  const where = filter && Object.keys(filter).length > 0 ? filter : undefined;

  const [decorations, total] = await prisma.$transaction([
    prisma.decoration.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        category: true,
      },
      take: limit > 0 ? limit : undefined,
      skip: skip >= 0 ? skip : undefined,
    }),
    prisma.decoration.count({ where }),
  ]);
  
  return {
    decorations,
    metaData: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    },
  };
};


export const decorationService = {
  getAllDecoration,
};