import { prisma } from "../../lib/prisma";
import { ICartItemPayload, ISyncCartPayload } from "./cart.interface";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";

const getCart = async (userId: string) => {
  const cartItems = await prisma.cartItem.findMany({
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
  return cartItems;
};

const addToCart = async (userId: string, payload: ICartItemPayload) => {
  const { bannerId, quantity, hasEyelets = false } = payload;

  const banner = await prisma.banner.findUnique({
    where: { id: bannerId },
  });

  if (!banner) {
    throw new AppError("Sjabloon/Ontwerp niet gevonden.", httpStatus.NOT_FOUND);
  }

  // Check if banner is owned by another user
  if (banner.userId && banner.userId !== userId) {
    throw new AppError("Je bent niet geautoriseerd om dit ontwerp toe te voegen.", httpStatus.FORBIDDEN);
  }

  // Check if item already exists in user's cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      bannerId,
    },
  });

  if (existingItem) {
    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
        hasEyelets: hasEyelets || existingItem.hasEyelets,
      },
      include: {
        banner: true,
      },
    });
    return updatedItem;
  }

  const newItem = await prisma.cartItem.create({
    data: {
      userId,
      bannerId,
      quantity,
      hasEyelets,
    },
    include: {
      banner: true,
    },
  });

  return newItem;
};

const updateCartItem = async (
  userId: string,
  cartItemId: string,
  payload: { quantity?: number; hasEyelets?: boolean }
) => {
  const { quantity, hasEyelets } = payload;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem) {
    throw new AppError("Product niet gevonden in winkelwagen.", httpStatus.NOT_FOUND);
  }

  if (cartItem.userId !== userId) {
    throw new AppError("Je bent niet geautoriseerd.", httpStatus.FORBIDDEN);
  }

  const updateData: any = {};
  if (quantity !== undefined) {
    if (quantity < 1) {
      throw new AppError("Aantal moet minstens 1 zijn.", httpStatus.BAD_REQUEST);
    }
    updateData.quantity = quantity;
  }
  if (hasEyelets !== undefined) {
    updateData.hasEyelets = hasEyelets;
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: updateData,
    include: {
      banner: true,
    },
  });

  return updatedItem;
};

const removeFromCart = async (userId: string, cartItemId: string) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem) {
    throw new AppError("Product niet gevonden in winkelwagen.", httpStatus.NOT_FOUND);
  }

  if (cartItem.userId !== userId) {
    throw new AppError("Je bent niet geautoriseerd.", httpStatus.FORBIDDEN);
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  return { id: cartItemId };
};

const syncCart = async (userId: string, payload: ISyncCartPayload) => {
  const { items } = payload;

  if (!items || !Array.isArray(items)) {
    return { success: true, count: 0 };
  }

  let count = 0;
  for (const item of items) {
    const { bannerId, quantity, hasEyelets = false } = item;
    
    // verify banner exists
    const banner = await prisma.banner.findUnique({
      where: { id: bannerId }
    });
    
    if (!banner) continue;

    // associate banner with user if it has no user assigned yet
    if (!banner.userId) {
      await prisma.banner.update({
        where: { id: bannerId },
        data: { userId }
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        bannerId,
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          hasEyelets: hasEyelets || existingItem.hasEyelets,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId,
          bannerId,
          quantity,
          hasEyelets,
        },
      });
    }
    count++;
  }

  return { success: true, count };
};

export const cartService = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  syncCart,
};
