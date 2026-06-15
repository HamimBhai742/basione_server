import { Request, Response } from "express";
import httpStatus from "http-status";
import { calculatePagination } from "../../utils/calculatePagination";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { templateReviewService } from "./templateReview.service";

const createOrUpdateReview = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const review = await templateReviewService.createOrUpdateReview(
      req.user.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review succesvol opgeslagen",
      data: review,
    });
  },
);

const getTemplateReviews = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const result = await templateReviewService.getTemplateReviews(
    req.params.templateId as string,
    page,
    limit,
    skip,
  );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reviews succesvol opgehaald",
      data: {
        reviews: result.reviews,
        summary: result.summary,
      },
      metaData: result.metaData,
    });
  });

const getTemplateReviewSummary = catchAsync(
  async (req: Request, res: Response) => {
    const summary = await templateReviewService.getTemplateReviewSummary(
      req.params.templateId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reviewoverzicht succesvol opgehaald",
      data: summary,
    });
  },
);

const getMyTemplateReviewEligibility = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const eligibility =
      await templateReviewService.getMyTemplateReviewEligibility(
        req.user.id,
        req.params.templateId as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reviewstatus succesvol opgehaald",
      data: eligibility,
    });
  },
);

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const result = await templateReviewService.getAllReviews(page, limit, skip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Alle reviews succesvol opgehaald",
    data: {
      reviews: result.reviews,
      summary: result.summary,
    },
    metaData: result.metaData,
  });
});

export const templateReviewController = {
  createOrUpdateReview,
  getTemplateReviews,
  getTemplateReviewSummary,
  getMyTemplateReviewEligibility,
  getAllReviews,
};
