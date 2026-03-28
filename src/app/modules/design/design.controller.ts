import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { designService } from "./design.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createDesign = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const design = await designService.createDesign(req.user.id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Design created successfully",
      data: design,
    });
  },
);

const myDesign = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const design = await designService.myDesign(req.user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Design fetched successfully",
      data: design,
    });
  },
);

export const designController = {
  myDesign,
  createDesign,
};
