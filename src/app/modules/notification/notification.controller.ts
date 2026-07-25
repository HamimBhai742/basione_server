import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { notificationService } from "./notification.service";
import { AppError } from "../../error/AppError";

type AuthRequest = Request & { user?: any };

const getAllNotifications = catchAsync(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role || "user";

  if (!userId) {
    throw new AppError("Ongeautoriseerd", httpStatus.UNAUTHORIZED);
  }

  const result = await notificationService.getAllNotifications(
    userId,
    userRole,
    req.query as any,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notificaties succesvol opgehaald",
    data: result.notifications,
    metaData: result.metaData,
  });
});

const markAsRead = catchAsync(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role || "user";
  const id = req.params.id as string;

  if (!userId) {
    throw new AppError("Ongeautoriseerd", httpStatus.UNAUTHORIZED);
  }

  const result = await notificationService.markAsRead(userId, userRole, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notificatie gemarkeerd als gelezen",
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role || "user";

  if (!userId) {
    throw new AppError("Ongeautoriseerd", httpStatus.UNAUTHORIZED);
  }

  const result = await notificationService.markAllAsRead(userId, userRole);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Alle notificaties gemarkeerd als gelezen",
    data: result,
  });
});

const deleteSingleNotification = catchAsync(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role || "user";
  const id = req.params.id as string;

  if (!userId) {
    throw new AppError("Ongeautoriseerd", httpStatus.UNAUTHORIZED);
  }

  const result = await notificationService.deleteSingleNotification(
    userId,
    userRole,
    id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const deleteMultipleNotifications = catchAsync(async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role || "user";

  if (!userId) {
    throw new AppError("Ongeautoriseerd", httpStatus.UNAUTHORIZED);
  }

  let ids: string[] | undefined = undefined;

  if (Array.isArray(req.body?.ids)) {
    ids = req.body.ids;
  } else if (typeof req.query?.ids === "string") {
    ids = req.query.ids.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const result = await notificationService.deleteMultipleNotifications(
    userId,
    userRole,
    ids,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const notificationController = {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteSingleNotification,
  deleteMultipleNotifications,
};
