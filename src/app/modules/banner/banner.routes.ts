import { Router } from "express";
import { bannerController } from "./banner.controller";
import { checkAuth, optionalAuth } from "../../middleware/checkAuth";
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

router.get("/templates", bannerController.getTemplates);

router.get("/template-categories", bannerController.getTemplateCategories);

router.get("/tuinposter-categories", bannerController.getTuinposterCategories);

router.get("/templates/:slug", bannerController.getTemplateBySlug);

router.get("/:id", optionalAuth("user", "admin"), bannerController.getSelectedBanner);

router.post(
  "/create-banner-by-template",
  optionalAuth("user"),
  upload.single("image"),
  bannerController.createBannerByTemplate,
);

router.post(
  "/create-banner-from-template",
  optionalAuth("user"),
  upload.single("image"),
  bannerController.createBannerFromTemplate,
);

router.patch(
  "/update-banner/:id",
  optionalAuth("user", "admin"),
  upload.single("image"),
  bannerController.updateBanner,
);

export const bannerRoutes = router;
