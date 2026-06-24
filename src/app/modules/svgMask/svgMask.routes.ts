import { Router } from "express";
import { svgMaskController } from "./svgMask.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { upload } from "../../middleware/upload";

const router = Router();

// Only admin can upload SVG masks
router.post(
  "/upload",
  checkAuth("admin"),
  upload.single("file"),
  svgMaskController.uploadSvgMask,
);

// Anyone (users & guest designers) can list masks for editor usage
router.get(
  "/",
  svgMaskController.getAllSvgMasks,
);

// Only admin can bind masks to predefined templates
router.post(
  "/bind",
  checkAuth("admin"),
  svgMaskController.bindMaskToTemplate,
);

// Only admin can delete SVG masks
router.delete(
  "/:id",
  checkAuth("admin"),
  svgMaskController.deleteSvgMask,
);

export const svgMaskRoutes = router;
