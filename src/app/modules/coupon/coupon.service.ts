import httpStatus from "http-status";
import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import {
  ICreateCouponPayload,
  IUpdateCouponPayload,
  IValidateCouponPayload,
  IValidateCouponResponse,
} from "./coupon.interface";

const roundToTwo = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

const createCoupon = async (payload: ICreateCouponPayload) => {
  const normalizedCode = payload.code.trim().toUpperCase();

  const existingCoupon = await prisma.coupon.findUnique({
    where: {
      code: normalizedCode,
    },
  });

  if (existingCoupon) {
    throw new AppError(
      `Kortingscode "${normalizedCode}" bestaat al.`,
      httpStatus.CONFLICT
    );
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: normalizedCode,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      minOrderAmount: payload.minOrderAmount ?? 0,
      maxDiscountAmount: payload.maxDiscountAmount ?? null,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      endDate: payload.endDate ? new Date(payload.endDate) : null,
      usageLimit: payload.usageLimit ?? null,
      isActive: payload.isActive ?? true,
      description: payload.description ?? null,
    },
  });

  return coupon;
};

const getAllCoupons = async (query: {
  searchTerm?: string;
  isActive?: string;
  page?: string;
  limit?: string;
}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 20);
  const skip = (page - 1) * limit;

  const andConditions: any[] = [];

  if (query.searchTerm) {
    const search = query.searchTerm.trim();
    andConditions.push({
      OR: [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    const isActiveBool = query.isActive === "true" || query.isActive === "1";
    andConditions.push({ isActive: isActiveBool });
  }

  const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where: whereCondition,
      include: {
        orders: {
          select: {
            discountAmount: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.coupon.count({ where: whereCondition }),
  ]);

  return {
    metaData: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    data: coupons,
  };
};

const getCouponById = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!coupon) {
    throw new AppError("Kortingscode niet gevonden.", httpStatus.NOT_FOUND);
  }

  return coupon;
};

const updateCoupon = async (id: string, payload: IUpdateCouponPayload) => {
  const existingCoupon = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!existingCoupon) {
    throw new AppError("Kortingscode niet gevonden.", httpStatus.NOT_FOUND);
  }

  let normalizedCode: string | undefined;
  if (payload.code) {
    normalizedCode = payload.code.trim().toUpperCase();
    if (normalizedCode !== existingCoupon.code) {
      const codeDuplicate = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });
      if (codeDuplicate) {
        throw new AppError(
          `Kortingscode "${normalizedCode}" bestaat al.`,
          httpStatus.CONFLICT
        );
      }
    }
  }

  const updatedCoupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(normalizedCode ? { code: normalizedCode } : {}),
      ...(payload.discountType !== undefined ? { discountType: payload.discountType } : {}),
      ...(payload.discountValue !== undefined ? { discountValue: payload.discountValue } : {}),
      ...(payload.minOrderAmount !== undefined ? { minOrderAmount: payload.minOrderAmount ?? 0 } : {}),
      ...(payload.maxDiscountAmount !== undefined ? { maxDiscountAmount: payload.maxDiscountAmount } : {}),
      ...(payload.startDate !== undefined
        ? { startDate: payload.startDate ? new Date(payload.startDate) : null }
        : {}),
      ...(payload.endDate !== undefined
        ? { endDate: payload.endDate ? new Date(payload.endDate) : null }
        : {}),
      ...(payload.usageLimit !== undefined ? { usageLimit: payload.usageLimit } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
    },
  });

  return updatedCoupon;
};

const deleteCoupon = async (id: string) => {
  const existingCoupon = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!existingCoupon) {
    throw new AppError("Kortingscode niet gevonden.", httpStatus.NOT_FOUND);
  }

  await prisma.coupon.delete({
    where: { id },
  });

  return { message: "Kortingscode succesvol verwijderd." };
};

/**
 * Validates a discount code against the product subtotal (strictly product, no shipping).
 */
const validateCoupon = async (
  payload: IValidateCouponPayload
): Promise<IValidateCouponResponse> => {
  const normalizedCode = payload.code.trim().toUpperCase();
  const productSubtotal = Number(payload.subtotal) || 0;

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    throw new AppError("Ongeldige kortingscode.", httpStatus.NOT_FOUND);
  }

  if (!coupon.isActive) {
    throw new AppError(
      "Deze kortingscode is momenteel niet actief.",
      httpStatus.BAD_REQUEST
    );
  }

  const now = new Date();

  if (coupon.startDate && now < coupon.startDate) {
    throw new AppError(
      "Deze kortingscode is nog niet geldig.",
      httpStatus.BAD_REQUEST
    );
  }

  if (coupon.endDate && now > coupon.endDate) {
    throw new AppError(
      "Deze kortingscode is verlopen.",
      httpStatus.BAD_REQUEST
    );
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(
      "Het maximale gebruik voor deze kortingscode is bereikt.",
      httpStatus.BAD_REQUEST
    );
  }

  if (coupon.minOrderAmount && productSubtotal < coupon.minOrderAmount) {
    throw new AppError(
      `Minimaal bestelbedrag voor deze code is € ${coupon.minOrderAmount.toFixed(2).replace(".", ",")}`,
      httpStatus.BAD_REQUEST
    );
  }

  // Calculate discount ONLY on product subtotal
  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = roundToTwo((productSubtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = roundToTwo(coupon.maxDiscountAmount);
    }
  } else if (coupon.discountType === "fixed") {
    discountAmount = roundToTwo(coupon.discountValue);
  }

  // Cap discount so it cannot exceed product subtotal
  discountAmount = Math.min(productSubtotal, discountAmount);
  const discountedSubtotal = roundToTwo(Math.max(0, productSubtotal - discountAmount));

  return {
    isValid: true,
    code: coupon.code,
    discountType: coupon.discountType as any,
    discountValue: coupon.discountValue,
    discountAmount,
    originalSubtotal: productSubtotal,
    discountedSubtotal,
    message: "Kortingscode succesvol toegepast!",
  };
};

export const couponService = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
