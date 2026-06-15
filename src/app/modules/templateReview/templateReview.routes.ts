import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { templateReviewController } from "./templateReview.controller";
import { templateReviewValidation } from "./templateReview.zod.schema";

const router = Router();

router.post(
  "/",
  checkAuth("user"),
  validateRequest(templateReviewValidation.createTemplateReviewZodSchema),
  templateReviewController.createOrUpdateReview,
);

router.get(
  "/templates/:templateId/eligibility",
  checkAuth("user"),
  templateReviewController.getMyTemplateReviewEligibility,
);

router.get(
  "/templates/:templateId/summary",
  templateReviewController.getTemplateReviewSummary,
);

router.get("/templates/:templateId", templateReviewController.getTemplateReviews);

router.get("/", templateReviewController.getAllReviews);

export const templateReviewRoutes = router;
