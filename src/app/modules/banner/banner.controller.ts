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
      message: "Banner succesvol aangemaakt",
      data: banner,
    });
  },
);

const createBannerByTemplate = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const banner = await bannerService.createBannerByTemplate(req);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Banner succesvol aangemaakt",
      data: banner,
    });
  },
);

const updateBanner = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const banner = await bannerService.updateBanner(req, req.params.id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Banner succesvol bijgewerkt",
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
      message: "Banner succesvol opgehaald",
      data: banner,
    });
  },
);

const getAllbanners = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const category = req.query.category as string;
  const categoryId = req.query.categoryId as string;
  const banners = await bannerService.getAllbanners(
    page,
    limit,
    skip,
    category,
    req.query.fetchFrom as "home" | "gallery",
    categoryId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banners succesvol opgehaald",
    data: banners.banners,
    metaData: banners.metaData,
  });
});

const getSelectedBanner = catchAsync(async (req: Request, res: Response) => {
  const banner = await bannerService.getSelectedBanner(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Banner succesvol opgehaald",
    data: banner,
  });
});

const getTemplates = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const occasion = req.query.occasion as string;
  const categoryId = req.query.categoryId as string;
  const category = req.query.category as string;
  const result = await bannerService.getTemplates(
    page,
    limit,
    skip,
    occasion,
    categoryId,
    category,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Templates succesvol opgehaald",
    data: result.templates,
    metaData: result.metaData,
  });
});

const getTemplateCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await bannerService.getTemplateCategories();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Templatecategorieen succesvol opgehaald",
    data: categories,
  });
});

const createBannerFromTemplate = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const banner = await bannerService.createBannerFromTemplate(req);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Banner succesvol aangemaakt op basis van template",
      data: banner,
    });
  },
);

const getTemplateBySlug = catchAsync(async (req: Request, res: Response) => {
  const template = await bannerService.getTemplateBySlug(req.params.slug as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Template succesvol opgehaald",
    data: template,
  });
});

export const bannerController = {
  mybanner,
  createBanner,
  getAllbanners,
  getSelectedBanner,
  createBannerByTemplate,
  updateBanner,
  getTemplates,
  getTemplateCategories,
  getTemplateBySlug,
  createBannerFromTemplate,
};
