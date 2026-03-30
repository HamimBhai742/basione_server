import { prisma } from "../../lib/prisma";

export enum ICategory {
  wedding = "wedding",
  birthday = "birthday",
  kids_party = "kids_party",
  baby_shower = "baby_shower",
  engagement = "engagement",
}

const createBanner = async (userId: string, payload: any) => {
  console.log(userId, payload);
  const size = `${payload.width} cm x ${payload.height} cm`;
  console.log(size);
  let price = 0;
  switch (size) {
    case "60 cm x 40 cm":
      price = 20;
      break;
    case "120 cm x 80 cm":
      price = 30;
      break;
    case "180 cm x 120 cm":
      price = 40;
      break;
    case "240 cm x 160 cm":
      price = 50;
      break;
    default:
      price = 50;
  }

  console.log(price);
  const prompt = `Create a ${payload.style} banner design for ${payload.describe} with size ${size} and user name ${payload.name} with background image of ${payload.image} and category ${payload.category} `;
  console.log(prompt);

  // const banner = await prisma.banner.create({
  //   data: {
  //     ...payload,
  //     userId,
  //   },
  // });
  // return banner;
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
  category?: ICategory,
) => {
  const banners = await prisma.banner.findMany({
    skip,
    take: limit,
    where: {
      category: category ? category : undefined,
    },
  });

  const total = await prisma.banner.count({
    where: {
      category: category ? category : undefined,
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

export const bannerService = {
  mybanner,
  createBanner,
  getAllbanners,
};
