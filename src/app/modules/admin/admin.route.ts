import { Router } from "express";
import { adminController } from "./admin.controller";
import { upload } from "../../middleware/upload";
import { checkAuth } from "../../middleware/checkAuth";

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

router.patch(
  "/update-decoration-category/:id",
  adminController.updateDecorationCategory,
);

router.delete(
  "/delete-decoration-category/:id",
  adminController.deleteDecorationCategory,
);

router.get("/single-order/:id", adminController.getSingleOrder);

router.get("/faqs", adminController.getFaqs);
router.post("/create-faq", adminController.createFaq);
router.patch("/update-faq/:id", adminController.updateFaq);
router.delete("/delete-faq/:id", adminController.deleteFaq);

// --- Admin Template Management Endpoints ---
router.post(
  "/create-template",
  checkAuth("admin"),
  upload.single("image"),
  adminController.createTemplate,
);

router.patch(
  "/update-template/:id",
  checkAuth("admin"),
  upload.single("image"),
  adminController.updateTemplate,
);

router.delete(
  "/delete-template/:id",
  checkAuth("admin"),
  adminController.deleteTemplate,
);

router.get(
  "/templates",
  checkAuth("admin"),
  adminController.getAllTemplates,
);

export const adminRoutes = router;
