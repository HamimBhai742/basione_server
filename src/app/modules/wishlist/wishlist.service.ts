import { prisma } from "../../lib/prisma";
import { ISyncWishlistPayload } from "./wishlist.interface";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";

const getWishlist = async (userId: string) => {
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: {
      userId,
    },
    include: {
      banner: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return wishlistItems;
};

const toggleWishlist = async (userId: string, bannerId: string) => {
  const banner = await prisma.banner.findUnique({
    where: { id: bannerId },
  });

  if (!banner) {
    throw new AppError("Ontwerp niet gevonden.", httpStatus.NOT_FOUND);
  }

  const existingItem = await prisma.wishlistItem.findFirst({
    where: {
      userId,
      bannerId,
    },
  });

  if (existingItem) {
    await prisma.wishlistItem.delete({
      where: { id: existingItem.id },
    });
    return { isFavorited: false };
  }

  const newItem = await prisma.wishlistItem.create({
    data: {
      userId,
      bannerId,
    },
    include: {
      banner: true,
    },
  });

  return { isFavorited: true, item: newItem };
};

const syncWishlist = async (userId: string, payload: ISyncWishlistPayload) => {
  const { bannerIds } = payload;

  if (!bannerIds || !Array.isArray(bannerIds)) {
    return { success: true, count: 0 };
  }

  let count = 0;
  for (const bannerId of bannerIds) {
    const banner = await prisma.banner.findUnique({
      where: { id: bannerId },
    });
    
    if (!banner) continue;

    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        userId,
        bannerId,
      },
    });

    if (!existingItem) {
      await prisma.wishlistItem.create({
        data: {
          userId,
          bannerId,
        },
      });
      count++;
    }
  }

  return { success: true, count };
};

export const wishlistService = {
  getWishlist,
  toggleWishlist,
  syncWishlist,
};
