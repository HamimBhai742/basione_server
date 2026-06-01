import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { fontService } from "./font.service";

const getPublicFonts = catchAsync(async (req: Request, res: Response) => {
  const fonts = await fontService.getPublicFonts();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fonts fetched successfully",
    data: fonts,
  });
});

const getAdminFonts = catchAsync(async (req: Request, res: Response) => {
  const fonts = await fontService.getAdminFonts();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fonts fetched successfully",
    data: fonts,
  });
});

const createFont = catchAsync(async (req: Request, res: Response) => {
  const font = await fontService.createFont(req.body, req.file);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Font created successfully",
    data: font,
  });
});

const updateFont = catchAsync(async (req: Request, res: Response) => {
  const font = await fontService.updateFont(
    req.params.id as string,
    req.body,
    req.file,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Font updated successfully",
    data: font,
  });
});

const deleteFont = catchAsync(async (req: Request, res: Response) => {
  await fontService.deleteFont(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Font deleted successfully",
    data: null,
  });
});

export const fontController = {
  getPublicFonts,
  getAdminFonts,
  createFont,
  updateFont,
  deleteFont,
};
