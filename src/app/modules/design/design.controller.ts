import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { designService, ICategory } from "./design.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { calculatePagination } from "../../utils/calculatePagination";

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

const getAllDesigns = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const category = req.query.category as string;
  const designs = await designService.getAllDesigns(
    page,
    limit,
    skip,
    category as ICategory,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Designs fetched successfully",
    data: designs.designs,
    metaData: designs.metaData,
  });
});

export const designController = {
  myDesign,
  createDesign,
  getAllDesigns,
};
