import { Router } from "express";
import { bannerController } from "./banner.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { createBannerZodSchema } from "./banner.zod.schema";

const router = Router();

router.post(
  "/create-banner",
  checkAuth("user"),
  validateRequest(createBannerZodSchema),
  bannerController.createBanner,
);

router.get("/my-banner", checkAuth("user"), bannerController.mybanner);

router.get("/all-banners", bannerController.getAllbanners);

export const bannerRoutes = router;
