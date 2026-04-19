import { prisma } from "../../lib/prisma";

type IOrderStatus =
  | "pending"
  | "processing"
  | "refunded"
  | "delivered"
  | "cancelled";

const totalOrder = async (
  page: number,
  limit: number,
  skip: number,
  filter: any,
  sortBy: string,
  sortOrder: "asc" | "desc",
) => {
  const where: any = {
    AND: [filter && filter].filter(Boolean),
  };
  const orders = await prisma.order.findMany({
    where,
    include: {
      banner: true,
      payment: true,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    take: limit,
    skip,
  });

  const total = await prisma.order.count({ where });
  return {
    orders,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const manageOrder = async (orderId: string, status: IOrderStatus) => {
  const order = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
  });
  return order;
};

const manageUsers = async (
  page: number,
  limit: number,
  skip: number,
  filter: any,
  sortBy: string,
  sortOrder: "asc" | "desc",
) => {
  console.log(sortBy, sortOrder);
  const where: any = {
    AND: [{ role: "user" }, filter && filter].filter(Boolean),
  };
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      phone: true,
      role: true,
      image: true,

      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    take: limit,
    skip,
  });
  const total = await prisma.user.count({ where });
  return {
    users,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateUserStatus = async (
  userId: string,
  status: "active" | "inactive" | "blocked",
) => {
  let isActive = true;
  if (status === "inactive" || status === "blocked") {
    isActive = false;
  }
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status,
      isActive,
    },
  });
  return user;
};

const dashboardStats = async () => {
  const totalUsers = await prisma.user.count();
  const totalActiveUsers = await prisma.user.count({
    where: {
      status: "active",
    },
  });

  const totalOrders = await prisma.order.count();
  const totalDeliveredOrders = await prisma.order.count({
    where: {
      status: "delivered",
    },
  });
  const totalProcessingOrders = await prisma.order.count({
    where: {
      status: "processing",
    },
  });

  const totalcancelledOrders = await prisma.order.count({
    where: {
      status: "cancelled",
    },
  });

  const totalRevenueData = await prisma.order.aggregate({
    _sum: {
      total: true,
    },
    where: {
      status: "delivered",
    },
  });

  const totalDeliveredRevenue = totalRevenueData._sum.total || 0;
  const totalCancelledRevenueData = await prisma.order.aggregate({
    _sum: {
      total: true,
    },
    where: {
      status: "cancelled",
    },
  });

  return {
    totalUsers,
    totalActiveUsers,
    totalOrders,
    totalDeliveredOrders,
    totalProcessingOrders,
    totalcancelledOrders,
    totalDeliveredRevenue,
    totalCancelledRevenue: totalCancelledRevenueData._sum.total || 0,
  };
};

const totalTransaction = async (
  page: number,
  limit: number,
  skip: number,
  filter: any,
  sortBy: string,
  sortOrder: "asc" | "desc",
) => {
  const where: any = {
    AND: [filter && filter].filter(Boolean),
  };
  const payments = await prisma.payment.findMany({
    where,
    include: {
      order: true,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    take: limit,
    skip,
  });
  const total = await prisma.payment.count({ where });
  return {
    payments,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const adminService = {
  totalOrder,
  manageOrder,
  manageUsers,
  updateUserStatus,
  dashboardStats,
  totalTransaction,
};
