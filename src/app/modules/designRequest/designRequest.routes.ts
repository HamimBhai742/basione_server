import { Router } from "express";
import { upload } from "../../middleware/upload";
import { designRequestController } from "./designRequest.controller";

const router = Router();

router.post(
  "/",
  upload.array("files", 10),
  designRequestController.createDesignRequest
);

export const designRequestRoutes = router;
