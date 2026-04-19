import { Router } from "express";
import { adminController } from "./admin.controller";

const router = Router();

router.get("/total-order", adminController.totalOrder);

router.patch("/manage-order/:id", adminController.manageOrder);

router.get("/manage-users", adminController.manageUsers);

router.patch("/update-user/:id", adminController.updateUserStatus);

router.get("/dashboard-stats", adminController.dashboardStats);

router.get("/total-transaction", adminController.totalTransaction);

export const adminRoutes = router;
