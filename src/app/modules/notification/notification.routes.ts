import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { notificationController } from "./notification.controller";

export const notificationRoutes = Router();

// All routes require authentication
notificationRoutes.use(checkAuth("admin", "user"));

notificationRoutes.get("/", notificationController.getAllNotifications);
notificationRoutes.patch("/mark-all-read", notificationController.markAllAsRead);
notificationRoutes.patch("/:id/read", notificationController.markAsRead);

// Deletion APIs
notificationRoutes.delete("/delete-multiple", notificationController.deleteMultipleNotifications);
notificationRoutes.delete("/:id", notificationController.deleteSingleNotification);
