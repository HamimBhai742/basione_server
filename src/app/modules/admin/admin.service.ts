import { prisma } from "../../lib/prisma";
import { orderUserSearchableFields } from "./admin.contain";

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
  searchTerm?: string,
) => {
  const cleanFilter = { ...filter };
  delete cleanFilter.searchTerm;

  const andConditions: any[] = [];

  if (Object.keys(cleanFilter).length > 0) {
    andConditions.push(cleanFilter);
  }

  if (searchTerm) {
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(searchTerm);

    const [matchedUsers, matchedBanners] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
            { phone: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      }),
      prisma.banner.findMany({
        where: {
          OR: [
            { headline: { contains: searchTerm, mode: "insensitive" } },
            { occasion: { contains: searchTerm, mode: "insensitive" } },
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { style: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      }),
    ]);

    const userIds = matchedUsers.map((u) => u.id);
    const bannerIds = matchedBanners.map((b) => b.id);

    const orConditions: any[] = [];

    if (isObjectId) {
      orConditions.push(
        { id: searchTerm },
        { userId: searchTerm },
        { bannerId: searchTerm },
      );
    }

    if (userIds.length > 0) {
      orConditions.push({
        userId: { in: userIds },
      });
    }

    if (bannerIds.length > 0) {
      orConditions.push({
        bannerId: { in: bannerIds },
      });
    }

    if (orConditions.length === 0) {
      return {
        orders: [],
        metaData: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    andConditions.push({
      OR: orConditions,
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  console.log("WHERE =>", JSON.stringify(where, null, 2));

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        banner: true,
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip,
    }),
    prisma.order.count({ where }),
  ]);

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
  searchTerm?: string,
) => {
  const cleanFilter = { ...filter };
  delete cleanFilter.searchTerm;

  const andConditions: any[] = [{ role: "user" }];

  if (Object.keys(cleanFilter).length > 0) {
    andConditions.push(cleanFilter);
  }

  if (searchTerm) {
    const search = orderUserSearchableFields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: "insensitive",
      },
    }));

    andConditions.push({
      OR: search,
    });
  }

  const where = { AND: andConditions };

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
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status,
    },
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
  searchTerm?: string,
) => {
  console.log(searchTerm)
  const cleanFilter = { ...filter };
  delete cleanFilter.searchTerm;

  const andConditions: any[] = [];

  if (Object.keys(cleanFilter).length > 0) {
    andConditions.push(cleanFilter);
  }

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          transactionId: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

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
