import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { bannerService, ICategory } from "./banner.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { calculatePagination } from "../../utils/calculatePagination";

const createBanner = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const banner = await bannerService.createBanner(req);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  },
);

const mybanner = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const banner = await bannerService.mybanner(req.user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "banner fetched successfully",
      data: banner,
    });
  },
);

const getAllbanners = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const category = req.query.category as string;
  const banners = await bannerService.getAllbanners(
    page,
    limit,
    skip,
    category,
    req.query.fetchFrom as "home" | "gallery",
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "banners fetched successfully",
    data: banners.banners,
    metaData: banners.metaData,
  });
});

const getSelectedBanner = catchAsync(async (req: Request, res: Response) => {
  const banner = await bannerService.getSelectedBanner(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "banner fetched successfully",
    data: banner,
  });
});

export const bannerController = {
  mybanner,
  createBanner,
  getAllbanners,
  getSelectedBanner,
};
