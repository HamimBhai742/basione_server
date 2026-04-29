import { Router } from "express";
import { bannerController } from "./banner.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../middleware/upload";
import { bannerGenerateSchema } from "./banner.zod.schema";

const router = Router();

router.post(
  "/generate",
  // checkAuth("user"),
  upload.single("image"),
  validateRequest(bannerGenerateSchema),
  bannerController.createBanner,
);

router.get("/my-banner", checkAuth("user"), bannerController.mybanner);

router.get("/all-banners", bannerController.getAllbanners);

router.get("/:id", bannerController.getSelectedBanner);

router.post(
  "/create-banner-by-template",
  // checkAuth("user"),
  upload.single("image"),
  bannerController.createBannerByTemplate,
);

router.patch(
  "/update-banner/:id",
  // checkAuth("user"),
  upload.single("image"),
  bannerController.updateBanner,
);

export const bannerRoutes = router;
