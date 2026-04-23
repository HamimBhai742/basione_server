import { Router } from "express";
import { adminController } from "./admin.controller";
import { upload } from "../../middleware/upload";

const router = Router();

router.get("/total-orders", adminController.totalOrder);

router.patch("/update-order/:id", adminController.manageOrder);

router.get("/total-users", adminController.manageUsers);

router.patch("/update-user/:id", adminController.updateUserStatus);

router.get("/dashboard-stats", adminController.dashboardStats);

router.get("/total-transaction", adminController.totalTransaction);

router.post(
  "/create-decoration",
  upload.single("file"),
  adminController.createDecoration,
);

router.delete("/decoration/:id", adminController.deleteDecoration);

router.get("/decorations", adminController.getAllDecoration);

router.post(
  "/create-decoration-category",
  adminController.createDecorationCategory,
);

router.get("/decoration-categories", adminController.getAllDecorationCategory);

export const adminRoutes = router;
