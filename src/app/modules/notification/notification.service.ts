import { prisma } from "../../lib/prisma";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";

interface PaginationOptions {
  page?: number;
  limit?: number;
}

const getAllNotifications = async (
  userId: string,
  userRole: string,
  pagination: PaginationOptions = {},
) => {
  const page = Math.max(1, Number(pagination.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(pagination.limit) || 20));
  const skip = (page - 1) * limit;

  // Filter: admins can see admin/system notifications or user notifications, normal users see their own
  const where: any =
    userRole === "admin"
      ? {
          OR: [{ userId }, { userId: null }],
        }
      : { userId };

  const [notifications, total, unreadCount] = await Promise.all([
    (prisma as any).notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    (prisma as any).notification.count({ where }),
    (prisma as any).notification.count({
      where: {
        ...where,
        isRead: false,
      },
    }),
  ]);

  return {
    metaData: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
    notifications,
  };
};

const markAsRead = async (userId: string, userRole: string, notificationId: string) => {
  const notification = await (prisma as any).notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError("Notificatie niet gevonden", httpStatus.NOT_FOUND);
  }

  if (userRole !== "admin" && notification.userId && notification.userId !== userId) {
    throw new AppError("Geen toegang tot deze notificatie", httpStatus.FORBIDDEN);
  }

  return (prisma as any).notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

const markAllAsRead = async (userId: string, userRole: string) => {
  const where: any =
    userRole === "admin"
      ? {
          OR: [{ userId }, { userId: null }],
          isRead: false,
        }
      : {
          userId,
          isRead: false,
        };

  return (prisma as any).notification.updateMany({
    where,
    data: { isRead: true },
  });
};

/**
 * Delete a single notification by ID
 */
const deleteSingleNotification = async (
  userId: string,
  userRole: string,
  notificationId: string,
) => {
  const notification = await (prisma as any).notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError("Notificatie niet gevonden", httpStatus.NOT_FOUND);
  }

  if (userRole !== "admin" && notification.userId && notification.userId !== userId) {
    throw new AppError("Geen toegang tot deze notificatie", httpStatus.FORBIDDEN);
  }

  await (prisma as any).notification.delete({
    where: { id: notificationId },
  });

  return { message: "Notificatie succesvol verwijderd" };
};

/**
 * Delete multiple notifications by IDs array (or all if ids is empty)
 */
const deleteMultipleNotifications = async (
  userId: string,
  userRole: string,
  ids?: string[],
) => {
  const baseWhere: any =
    userRole === "admin"
      ? {
          OR: [{ userId }, { userId: null }],
        }
      : { userId };

  let finalWhere: any = { ...baseWhere };

  if (Array.isArray(ids) && ids.length > 0) {
    finalWhere = {
      ...baseWhere,
      id: { in: ids },
    };
  }

  const result = await (prisma as any).notification.deleteMany({
    where: finalWhere,
  });

  return {
    message: `${result.count} notificatie(s) succesvol verwijderd`,
    deletedCount: result.count,
  };
};

export const notificationService = {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteSingleNotification,
  deleteMultipleNotifications,
};
