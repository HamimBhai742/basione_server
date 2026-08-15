import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { couponService } from "./coupon.service";

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.createCoupon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Kortingscode succesvol aangemaakt.",
    data: result,
  });
});

const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.getAllCoupons(req.query as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kortingscodes succesvol opgehaald.",
    metaData: result.metaData,
    data: result.data,
  });
});

const getCouponById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await couponService.getCouponById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kortingscode succesvol opgehaald.",
    data: result,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await couponService.updateCoupon(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kortingscode succesvol bijgewerkt.",
    data: result,
  });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await couponService.deleteCoupon(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kortingscode succesvol verwijderd.",
    data: result,
  });
});

const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.validateCoupon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kortingscode succesvol gevalideerd.",
    data: result,
  });
});

export const couponController = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
