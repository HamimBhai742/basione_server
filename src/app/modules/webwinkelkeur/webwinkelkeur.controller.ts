import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { webwinkelkeurService } from "./webwinkelkeur.service";

const getReviews = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const productId = (req.query.productId || req.query.product_id) as string;

  let result;
  if (productId) {
    result = await webwinkelkeurService.getProductReviews(productId, limit, offset);
  } else {
    result = await webwinkelkeurService.getShopReviews(limit, offset);
  }

  const isSuccess = result.status === "success" || result.product_reviews !== undefined;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: isSuccess,
    message: isSuccess ? "WebwinkelKeur reviews successfully retrieved!" : (result.message || "Could not retrieve reviews"),
    data: result,
  });
});

export const webwinkelkeurController = {
  getReviews,
};
