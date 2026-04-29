import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import { orderUserSearchableFields } from "./admin.contain";
import httpStatus from "http-status";
import { orderDeliveryCompleteTemplate } from "../../utils/emailTemplates/orderDeliveryTemplate";
import { cancledOrder } from "../order/order.service";
import { orderRefundedTemplate } from "../../utils/emailTemplates/orderRefunded";
import { orderReadyTemplate } from "../../utils/emailTemplates/orderReadyTemplate";
import { orderShippedTemplate } from "../../utils/emailTemplates/orderShipped";

type IOrderStatus =
  | "pending"
  | "processing"
  | "ready"
  | "shipped"
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

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        banner: true,
        payment: true,
        addresses: true,
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
  const payemt = await prisma.payment.findUnique({
    where: {
      orderId,
    },
  });

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
      banner: true,
      addresses: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", httpStatus.NOT_FOUND);
  }

  const data = {
    orderNumber: orderId as string,

    deliveredDate: order?.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : "",

    items: [
      {
        name: order?.banner?.name as string,
        quantity: order?.quantity as number,
        price: order?.banner?.price as number,
        image: order?.banner?.imageUrl as string, // ⚠️ imageUrl → image
      },
    ],

    totalAmount: order?.total as number,

    deliveryAddress: `${order?.addresses?.houseNumber || ""} ${
      order?.addresses?.street || ""
    } ${order?.addresses?.city || ""}, ${order?.addresses?.zipCode || ""}`,

    reviewLink: "", // optional
  };

  const refundedData = {
    orderNumber: orderId as string,

    refundDate: new Date().toLocaleString(), // বা backend থেকে refund date

    refundAmount: order?.total as number, // বা partial হলে change করবা

    refundMethod: "Mollie", // dynamic হলে payment method use করো

    refundReason: "Order cancelled", // optional (dynamic দিতে পারো)

    items: [
      {
        name: order?.banner?.name as string,
        quantity: order?.quantity as number,
        price: order?.banner?.price as number,
        image: order?.banner?.imageUrl as string,
      },
    ],

    estimatedArrival: "", // optional (refund case-এ usually empty)

    supportLink: "https://yourwebsite.com/support", // optional
  };

  const orderReadyData = {
    orderNumber: orderId as string,
    readyDate: order?.updatedAt
      ? new Date(order.updatedAt).toLocaleString()
      : "",
    pickupAddress: order?.addresses?.address
      ? order?.addresses?.address
      : `${order?.addresses?.houseNumber || ""} ${order?.addresses?.street || ""} ${order?.addresses?.city || ""}, ${order?.addresses?.zipCode || ""}`,
    items: [
      {
        name: order?.banner?.name as string,
        quantity: order?.quantity as number,
        price: order?.banner?.price as number,
        image: order?.banner?.imageUrl as string, // ⚠️ imageUrl → image
      },
    ],
    totalAmount: order?.total as number,
    paymentMethod: "Mollie",
    deliveryAddress: `${order?.addresses?.houseNumber || ""} ${
      order?.addresses?.street || ""
    } ${order?.addresses?.city || ""}, ${order?.addresses?.zipCode || ""}`,

    trackingLink: "",
    supportLink: "https://yourwebsite.com/support",
  };

  if (status === "ready") {
    if (payemt?.status !== "paid") {
      throw new AppError(
        "Only orders with paid status can be updated",
        httpStatus.BAD_REQUEST,
      );
    }

    if (order.status !== "processing") {
      throw new AppError(
        "Only orders with processing status can be ready for delivery",
        httpStatus.BAD_REQUEST,
      );
    }
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "ready",
      },
    });

    await orderReadyTemplate(
      order.user.name,
      order.user.email,
      "Order Ready for Delivery",
      orderReadyData,
    );
  } else if (status === "delivered") {
    if (payemt?.status !== "paid") {
      throw new AppError(
        "Only orders with paid status can be updated",
        httpStatus.BAD_REQUEST,
      );
    }
    if (order.status !== "shipped") {
      throw new AppError(
        "Only orders with ready status can be updated to delivered",
        httpStatus.BAD_REQUEST,
      );
    }
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "delivered",
      },
    });

    await orderDeliveryCompleteTemplate(
      order.user.name,
      order.user.email,
      "Order Delivered",
      data,
    );
  } else if (status === "cancelled") {
    await cancledOrder(orderId, "Order canclled by admin");
  } else if (status === "refunded") {
    if (payemt?.status !== "paid") {
      throw new AppError(
        "Only orders with paid status can be updated",
        httpStatus.BAD_REQUEST,
      );
    }

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "refunded",
      },
    });
    await orderRefundedTemplate(
      order.user.name,
      order.user.email,
      "Order Refunded",
      refundedData,
    );
  } else if (status === "shipped") {
    if (order.status !== "ready") {
      throw new AppError(
        "Only orders with ready status can be updated to shipped",
      );
    }

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "shipped",
      },
    });
    const shippedData = {
      orderNumber: orderId as string,
      shippedDate: new Date().toLocaleString(),
      estimatedDelivery: order?.deliveryTime as string,
      courierName: "DHL",
      trackingNumber: order?.trackingNumber as string,
      trackingLink: `http://localhost:3000/profile/${orderId}`,

      items: [
        {
          name: order?.banner?.name as string,
          quantity: order?.quantity as number,
          price: order?.banner?.price as number,
          image: order?.banner?.imageUrl as string, // ⚠️ imageUrl → image
        },
      ],
      totalAmount: order?.total as number,
      deliveryAddress: `${order?.addresses?.houseNumber || ""}, ${
        order?.addresses?.street || ""
      }, ${order?.addresses?.city || ""}, ${order?.addresses?.zipCode || ""}`,
      supportLink: "", // optional
    };

    await orderShippedTemplate(
      order.user.name,
      order.user.email,
      "Order Shipped",
      shippedData,
    );
  }
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
  console.log(searchTerm);
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

const createDecoration = async (data: any) => {
  const { categoryId } = JSON.parse(data.data);
  const decoration = await prisma.decoration.create({
    data: {
      image: data.image,
      categoryId,
    },
  });
  return decoration;
};

const deleteDecoration = async (id: string) => {
  await prisma.decoration.delete({
    where: {
      id,
    },
  });
  return true;
};

const getAllDecoration = async (
  page: number,
  limit: number,
  skip: number,
  filter: any,
  sortBy: string,
  sortOrder: "asc" | "desc",
) => {
  const decorations = await prisma.decoration.findMany({
    where: filter && Object.keys(filter).length > 0 ? filter : undefined,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      category: true,
    },
    take: limit,
    skip,
  });
  return {
    decorations,
    metaData: {
      page,
      limit,
      total: decorations?.length,
      totalPages: Math.ceil(decorations?.length / limit),
    },
  };
};

const createDecorationCategory = async (name: string) => {
  const isExist = await prisma.decorationCategory.findUnique({
    where: {
      name,
    },
  });

  if (isExist) {
    throw new AppError("Decoration category already exists");
  }
  const category = await prisma.decorationCategory.create({
    data: {
      name: name.toUpperCase(),
    },
  });
  return category;
};

const getAllDecorationCategory = async () => {
  const categories = await prisma.decorationCategory.findMany();
  return categories;
};

const updateDecorationCategory = async (id: string, name: string) => {
  const isExist = await prisma.decorationCategory.findUnique({
    where: {
      id,
    },
  });

  if (!isExist) {
    throw new AppError("Decoration category not found");
  }
  const category = await prisma.decorationCategory.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
  return category;
};

const deleteDecorationCategory = async (id: string) => {
  const isExist = await prisma.decorationCategory.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new AppError("Decoration category not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.decoration.deleteMany({
      where: {
        categoryId: id,
      },
    });

    await tx.decorationCategory.delete({
      where: { id },
    });
  });

  return true;
};

const getSingleOrder = async (orderId: string) => {
  console.log("object")
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
      banner: true,
      addresses: true,
      payment: true,
    },
  });

  return order;
};

export const adminService = {
  totalOrder,
  manageOrder,
  manageUsers,
  updateUserStatus,
  dashboardStats,
  totalTransaction,
  createDecoration,
  deleteDecoration,
  createDecorationCategory,
  getAllDecorationCategory,
  getAllDecoration,
  updateDecorationCategory,
  deleteDecorationCategory,
  getSingleOrder,
};
