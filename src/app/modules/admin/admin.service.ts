import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import config from "../../../config";
import { orderUserSearchableFields } from "./admin.contain";
import httpStatus from "http-status";
import { cancledOrder } from "../order/order.service";
import { orderRefundedTemplate } from "../../utils/emailTemplates/orderRefunded";
import { orderReadyTemplate } from "../../utils/emailTemplates/orderReadyTemplate";
import { orderShippedTemplate } from "../../utils/emailTemplates/orderShipped";
import { stat } from "fs";
import { uploadImageToS3, uploadBufferToS3 } from "../../utils/uploadAws";
import { getS3KeyFromUrl } from "../../utils/getS3KeyFromUrl";
import { deleteImageFromS3 } from "../../utils/deleteImageFromS3";
import { generateGardenMockup } from "../../utils/generateMockup";
import axios from "axios";
import { generateUniqueBannerSlug } from "../banner/banner.service";
import { QlsCarrierCode, shippingService } from "../shipping/shipping.service";
import { sendDeliveredOrderReviewEmail } from "../../utils/orderReview";
import { formatLabel } from "../../utils/formatLable";

const bannerListSelect = {
  id: true,
  userId: true,
  templateCategoryId: true,
  templateCategory: true,
  templateCategoryIds: true,
  templateCategories: true,
  occasion: true,
  style: true,
  headline: true,
  slug: true,
  name: true,
  price: true,
  hobbies: true,
  description: true,
  sizeType: true,
  sizeLabel: true,
  width: true,
  height: true,
  imageUrl: true,
  variant: true,
  designNumber: true,
  revisedPrompt: true,
  isSelected: true,
  isTemplate: true,
  generationId: true,
  createdAt: true,
  updatedAt: true,
  svgMaskId: true,
  svgMask: {
    select: {
      id: true,
      name: true,
      svgUrl: true,
    },
  },
};

const generateUniqueTemplateCategorySlug = async (
  name: string,
  currentId?: string,
): Promise<string> => {
  const baseSlug = generateSlug(name || "category");
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const isExist = await prisma.templateCategory.findFirst({
      where: {
        slug,
        ...(currentId ? { id: { not: currentId } } : {}),
      },
    });

    if (!isExist) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

const generateSlug = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

type IOrderStatus =
  | "pending"
  | "processing"
  | "ready"
  | "shipped"
  | "refunded"
  | "delivered"
  | "cancelled";

type ManageOrderOptions = {
  carrier?: QlsCarrierCode;
  productCombinationId?: number;
};

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

  for (const key of Object.keys(cleanFilter)) {
    if (
      cleanFilter[key] === "" ||
      cleanFilter[key] === "all" ||
      cleanFilter[key] === undefined ||
      cleanFilter[key] === null
    ) {
      delete cleanFilter[key];
    }
  }

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

  const where =
    andConditions.length > 0
      ? { AND: [...andConditions] }
      : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: where,
      include: {
        banner: {
          select: {
            id: true,
            occasion: true,
            style: true,
            name: true,
            price: true,
            imageUrl: true,
            variant: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        payment: true,
        addresses: true,
        invoice: true,
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

const manageOrder = async (
  orderId: string,
  status: IOrderStatus,
  options: ManageOrderOptions = {},
) => {
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
    throw new AppError("Bestelling niet gevonden", httpStatus.NOT_FOUND);
  }
  const customerName =
    order.user?.name || order.guestName || order.addresses?.name || "Customer";
  const customerEmail =
    order.user?.email || order.guestEmail || order.addresses?.email;

  if (!customerEmail) {
    throw new AppError("E-mailadres niet gevonden", httpStatus.BAD_REQUEST);
  }

  const data = {
    orderNumber: orderId as string,

    deliveredDate: order?.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : "",

    items: [
      {
        name: (order?.banner?.name || (order?.banner?.occasion ? `${formatLabel(order.banner.occasion)} Banner` : "Banner")) as string,
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
        name: (order?.banner?.name || (order?.banner?.occasion ? `${formatLabel(order.banner.occasion)} Banner` : "Banner")) as string,
        quantity: order?.quantity as number,
        price: order?.banner?.price as number,
        image: order?.banner?.imageUrl as string,
      },
    ],

    estimatedArrival: "", // optional (refund case-এ usually empty)

    supportLink: `${config.client_url}/contact`, // optional
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
        name: (order?.banner?.name || (order?.banner?.occasion ? `${formatLabel(order.banner.occasion)} Banner` : "Banner")) as string,
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
    supportLink: `${config.client_url}/contact`,
  };

  if (status === "ready") {
    if (payemt?.status !== "paid") {
      throw new AppError(
        "Alleen betaalde bestellingen kunnen worden bijgewerkt",
        httpStatus.BAD_REQUEST,
      );
    }

    if (order.status !== "processing") {
      throw new AppError(
        "Alleen bestellingen met status 'processing' kunnen klaar worden gezet voor levering",
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
      customerName,
      customerEmail,
      "Bestelling klaar voor levering",
      orderReadyData,
    );
  } else if (status === "delivered") {
    if (payemt?.status !== "paid") {
      throw new AppError(
        "Alleen betaalde bestellingen kunnen worden bijgewerkt",
        httpStatus.BAD_REQUEST,
      );
    }
    if (order.status !== "shipped") {
      throw new AppError(
        "Alleen bestellingen met status 'shipped' kunnen als geleverd worden gemarkeerd",
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

    await sendDeliveredOrderReviewEmail(orderId);
  } else if (status === "cancelled") {
    await cancledOrder(orderId, "Bestelling geannuleerd door beheerder");
  } else if (status === "refunded") {
    if (payemt?.status !== "paid") {
      throw new AppError(
        "Alleen betaalde bestellingen kunnen worden bijgewerkt",
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
      customerName,
      customerEmail,
      "Bestelling terugbetaald",
      refundedData,
    );
  } else if (status === "shipped") {
    if (order.status !== "ready") {
      throw new AppError(
        "Alleen bestellingen met status 'ready' kunnen op 'shipped' worden gezet",
      );
    }

    if (order.deliveryMethod === "delivery" && !options.carrier) {
      throw new AppError(
        "Selecteer een vervoerder voordat u de bestelling verzendt",
        httpStatus.BAD_REQUEST,
      );
    }

    const shipment =
      order.deliveryMethod === "delivery"
        ? await shippingService.createShipment({
            orderId,
            carrier: options.carrier,
            productCombinationId: options.productCombinationId,
          })
        : null;

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
      courierName: shipment
        ? shippingService.getCarrierLabel(options.carrier)
        : "Afhalen",
      trackingNumber:
        shipment?.trackingId ||
        shipment?.barcode ||
        (order?.trackingNumber as string),
      trackingLink:
        shipment?.trackingUrl || `${config.client_url}/profile/${orderId}`,

      items: [
        {
          name: (order?.banner?.name || (order?.banner?.occasion ? `${formatLabel(order.banner.occasion)} Banner` : "Banner")) as string,
          quantity: order?.quantity as number,
          price: order?.banner?.price as number,
          image: order?.banner?.imageUrl as string, // ⚠️ imageUrl → image
        },
      ],
      totalAmount: order?.total as number,
      deliveryAddress: `${order?.addresses?.houseNumber || ""}, ${
        order?.addresses?.street || ""
      }, ${order?.addresses?.city || ""}, ${order?.addresses?.zipCode || ""}`,
      supportLink: `${config.client_url}/contact`, // optional
    };

    await orderShippedTemplate(
      customerName,
      customerEmail,
      "Bestelling verzonden",
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

  for (const key of Object.keys(cleanFilter)) {
    if (
      cleanFilter[key] === "" ||
      cleanFilter[key] === "all" ||
      cleanFilter[key] === undefined ||
      cleanFilter[key] === null
    ) {
      delete cleanFilter[key];
    }
  }

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
  const cleanFilter = { ...filter };
  delete cleanFilter.searchTerm;

  for (const key of Object.keys(cleanFilter)) {
    if (
      cleanFilter[key] === "" ||
      cleanFilter[key] === "all" ||
      cleanFilter[key] === undefined ||
      cleanFilter[key] === null
    ) {
      delete cleanFilter[key];
    }
  }

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
  const cleanFilter = { ...filter };
  for (const key of Object.keys(cleanFilter)) {
    if (
      cleanFilter[key] === "" ||
      cleanFilter[key] === "all" ||
      cleanFilter[key] === undefined ||
      cleanFilter[key] === null
    ) {
      delete cleanFilter[key];
    }
  }

  const decorations = await prisma.decoration.findMany({
    where: Object.keys(cleanFilter).length > 0 ? cleanFilter : undefined,
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
    throw new AppError("Decoratiecategorie bestaat al");
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
    throw new AppError("Decoratiecategorie niet gevonden");
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
    throw new AppError("Decoratiecategorie niet gevonden");
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

const createFaq = async (data: { category: string; question: string; answer: string }) => {
  const faq = await prisma.faq.create({
    data,
  });
  return faq;
};

const updateFaq = async (id: string, data: Partial<{ category: string; question: string; answer: string }>) => {
  const isExist = await prisma.faq.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new AppError("FAQ niet gevonden", httpStatus.NOT_FOUND);
  }

  const faq = await prisma.faq.update({
    where: { id },
    data,
  });
  return faq;
};

const deleteFaq = async (id: string) => {
  const isExist = await prisma.faq.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new AppError("FAQ niet gevonden", httpStatus.NOT_FOUND);
  }

  await prisma.faq.delete({
    where: { id },
  });
  return true;
};

const getFaqs = async () => {
  const faqs = await prisma.faq.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
  return faqs;
};

const createTemplateCategory = async (data: {
  name: string;
  slug?: string;
  isActive?: boolean;
}) => {
  const name = data.name?.trim();

  if (!name) {
    throw new AppError("Categorienaam is verplicht", httpStatus.BAD_REQUEST);
  }

  const slug = data.slug?.trim()
    ? generateSlug(data.slug)
    : await generateUniqueTemplateCategorySlug(name);

  const category = await prisma.templateCategory.create({
    data: {
      name,
      slug,
      isActive: data.isActive ?? true,
    },
  });

  return category;
};

const getAllTemplateCategories = async () => {
  const categories = await prisma.templateCategory.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};

const updateTemplateCategory = async (
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    isActive: boolean;
  }>,
) => {
  const isExist = await prisma.templateCategory.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new AppError("Templatecategorie niet gevonden", httpStatus.NOT_FOUND);
  }

  const updateData: any = {};

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) {
      throw new AppError("Categorienaam is verplicht", httpStatus.BAD_REQUEST);
    }
    updateData.name = name;
  }

  if (data.slug !== undefined) {
    updateData.slug = await generateUniqueTemplateCategorySlug(data.slug, id);
  } else if (data.name !== undefined && data.name !== isExist.name) {
    updateData.slug = await generateUniqueTemplateCategorySlug(data.name, id);
  }

  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const category = await prisma.templateCategory.update({
    where: { id },
    data: updateData,
  });

  return category;
};

const deleteTemplateCategory = async (id: string) => {
  const isExist = await prisma.templateCategory.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new AppError("Templatecategorie niet gevonden", httpStatus.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.banner.updateMany({
      where: {
        templateCategoryId: id,
      },
      data: {
        templateCategoryId: null,
      },
    });

    await tx.templateCategory.delete({
      where: { id },
    });
  });

  return true;
};

const resolveTemplateCategory = async (parsedData: any) => {
  if (parsedData.templateCategoryId || parsedData.categoryId) {
    const category = await prisma.templateCategory.findUnique({
      where: { id: parsedData.templateCategoryId || parsedData.categoryId },
    });

    if (!category) {
      throw new AppError("Templatecategorie niet gevonden", httpStatus.NOT_FOUND);
    }

    return category;
  }

  const categorySlug = parsedData.templateCategorySlug || parsedData.category;
  if (categorySlug) {
    return prisma.templateCategory.findFirst({
      where: {
        slug: categorySlug,
      },
    });
  }

  return null;
};

const createTemplate = async (payload: any, file?: Express.Multer.File) => {
  let parsedData = payload;
  if (typeof payload === "string" || (payload.data && typeof payload.data === "string")) {
    parsedData = JSON.parse(payload.data || payload);
  }

  const width = Number(parsedData?.width || 0);
  const height = Number(parsedData?.height || 0);

  if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
    throw new AppError(
      "Ongeldige template-afmetingen. Breedte en hoogte moeten positieve getallen zijn.",
      400,
    );
  }

  let imageUrl = "";
  let mockupUrl = null;
  const isReadymade = parsedData.isReadymade === true || parsedData.isReadymade === "true";

  if (file) {
    imageUrl = await uploadImageToS3(file);
    if (isReadymade) {
      try {
        const mockupBuffer = await generateGardenMockup(file.buffer);
        mockupUrl = await uploadBufferToS3({
          buffer: mockupBuffer,
          key: `mockups/${Date.now()}-mockup.png`,
          contentType: "image/png",
        });
      } catch (err) {
        console.error("Mockup generation failed:", err);
      }
    }
  } else if (parsedData.imageUrl) {
    imageUrl = parsedData.imageUrl;
    mockupUrl = parsedData.mockupUrl || null;
  } else {
    throw new AppError("Template-afbeelding is verplicht.", 400);
  }

  const areaM2 = (width / 100) * (height / 100);
  const pricePerM2 = areaM2 < 1 ? 25 : 20;
  const calculatedPrice = areaM2 * pricePerM2;
  const fallbackPrice = Math.max(calculatedPrice, 12);
  const finalPrice = parsedData.price !== undefined && parsedData.price !== "" && parsedData.price !== null && !isNaN(Number(parsedData.price))
    ? Number(parsedData.price)
    : fallbackPrice;

  const headline = parsedData.headline || "Template Headline";
  const slug = await generateUniqueBannerSlug(parsedData.slug || headline);
  const templateCategory = await resolveTemplateCategory(parsedData);

  const template = await prisma.banner.create({
    data: {
      templateCategoryId: templateCategory?.id || null,
      templateCategoryIds: parsedData.categoryIds || (templateCategory?.id ? [templateCategory.id] : []),
      occasion: parsedData.occasion || templateCategory?.slug || "custom",
      style: parsedData.style || "Template",
      headline,
      slug,
      name: parsedData.name || null,
      description: parsedData.description || null,
      sizeType: parsedData.sizeType || "custom",
      sizeLabel: parsedData.sizeLabel || "Custom Size",
      width,
      height,
      imageUrl,
      price: Number(finalPrice.toFixed(2)),
      isTemplate: true,
      isReadymade,
      mockupUrl,
      variant: 0,
      status: "GENERATED",
      canvasJSON: parsedData.canvasJSON || null,
      metaTitle: parsedData.metaTitle || null,
      metaDescription: parsedData.metaDescription || null,
      h1Title: parsedData.h1Title || null,
      introText: parsedData.introText || null,
      seoDescription: parsedData.seoDescription || null,
      svgMaskId: parsedData.svgMaskId || null,
    },
  });

  return template;
};

const updateTemplate = async (templateId: string, payload: any, file?: Express.Multer.File) => {
  const isExist = await prisma.banner.findUnique({
    where: { id: templateId, isTemplate: true },
  });

  if (!isExist) {
    throw new AppError("Template niet gevonden", httpStatus.NOT_FOUND);
  }

  let parsedData = payload;
  if (typeof payload === "string" || (payload.data && typeof payload.data === "string")) {
    parsedData = JSON.parse(payload.data || payload);
  }

  const updateData: any = {};

  if (parsedData.occasion !== undefined) updateData.occasion = parsedData.occasion;
  if (parsedData.categoryIds !== undefined) {
    updateData.templateCategoryIds = parsedData.categoryIds;
    updateData.templateCategoryId = parsedData.categoryIds[0] || null;
  } else if (
    parsedData.templateCategoryId !== undefined ||
    parsedData.categoryId !== undefined ||
    parsedData.templateCategorySlug !== undefined ||
    parsedData.category !== undefined
  ) {
    const templateCategory = await resolveTemplateCategory(parsedData);
    updateData.templateCategoryId = templateCategory?.id || null;
    if (templateCategory) {
      updateData.templateCategoryIds = [templateCategory.id];
    } else {
      updateData.templateCategoryIds = [];
    }
    if (parsedData.occasion === undefined && templateCategory) {
      updateData.occasion = templateCategory.slug;
    }
  }
  if (parsedData.style !== undefined) updateData.style = parsedData.style;
  if (parsedData.headline !== undefined) {
    updateData.headline = parsedData.headline;
    if (parsedData.slug) {
      updateData.slug = await generateUniqueBannerSlug(parsedData.slug, templateId);
    } else if (parsedData.headline !== isExist.headline) {
      updateData.slug = await generateUniqueBannerSlug(parsedData.headline, templateId);
    }
  } else if (parsedData.slug !== undefined) {
    updateData.slug = await generateUniqueBannerSlug(parsedData.slug, templateId);
  }
  if (parsedData.name !== undefined) updateData.name = parsedData.name;
  if (parsedData.description !== undefined) updateData.description = parsedData.description;
  if (parsedData.sizeType !== undefined) updateData.sizeType = parsedData.sizeType;
  if (parsedData.sizeLabel !== undefined) updateData.sizeLabel = parsedData.sizeLabel;
  if (parsedData.canvasJSON !== undefined) updateData.canvasJSON = parsedData.canvasJSON;
  if (parsedData.metaTitle !== undefined) updateData.metaTitle = parsedData.metaTitle;
  if (parsedData.metaDescription !== undefined) updateData.metaDescription = parsedData.metaDescription;
  if (parsedData.h1Title !== undefined) updateData.h1Title = parsedData.h1Title;
  if (parsedData.seoDescription !== undefined) updateData.seoDescription = parsedData.seoDescription;
  if (parsedData.svgMaskId !== undefined) {
    updateData.svgMaskId = parsedData.svgMaskId || null;
  }

  let width = isExist.width;
  let height = isExist.height;

  if (parsedData.width !== undefined) {
    width = Number(parsedData.width);
    updateData.width = width;
  }
  if (parsedData.height !== undefined) {
    height = Number(parsedData.height);
    updateData.height = height;
  }

  if (parsedData.price !== undefined) {
    if (parsedData.price === "" || parsedData.price === null) {
      const areaM2 = (width / 100) * (height / 100);
      const pricePerM2 = areaM2 < 1 ? 25 : 20;
      const calculatedPrice = areaM2 * pricePerM2;
      const finalPrice = Math.max(calculatedPrice, 12);
      updateData.price = Number(finalPrice.toFixed(2));
    } else {
      updateData.price = Number(parsedData.price);
    }
  } else if (parsedData.width !== undefined || parsedData.height !== undefined) {
    if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
      throw new AppError("Ongeldige template-afmetingen.", 400);
    }
    const areaM2 = (width / 100) * (height / 100);
    const pricePerM2 = areaM2 < 1 ? 25 : 20;
    const calculatedPrice = areaM2 * pricePerM2;
    const finalPrice = Math.max(calculatedPrice, 12);
    updateData.price = Number(finalPrice.toFixed(2));
  }

  const isReadymade = parsedData.isReadymade !== undefined
    ? (parsedData.isReadymade === true || parsedData.isReadymade === "true")
    : isExist.isReadymade;

  updateData.isReadymade = isReadymade;

  if (isReadymade) {
    if (file) {
      const fileUrl = await uploadImageToS3(file);
      updateData.imageUrl = fileUrl;

      if (isExist.imageUrl) {
        const oldKey = getS3KeyFromUrl(isExist.imageUrl);
        if (oldKey) {
          await deleteImageFromS3(oldKey);
        }
      }

      try {
        const mockupBuffer = await generateGardenMockup(file.buffer);
        const mockupUrl = await uploadBufferToS3({
          buffer: mockupBuffer,
          key: `mockups/${Date.now()}-mockup.png`,
          contentType: "image/png",
        });
        updateData.mockupUrl = mockupUrl;

        if (isExist.mockupUrl) {
          const oldMockupKey = getS3KeyFromUrl(isExist.mockupUrl);
          if (oldMockupKey) {
            await deleteImageFromS3(oldMockupKey);
          }
        }
      } catch (err) {
        console.error("Mockup generation failed on update:", err);
      }
    } else if (!isExist.isReadymade) {
      // Transitioning from standard to readymade without a new file upload.
      // Generate mockup from the existing image.
      if (isExist.imageUrl) {
        try {
          const response = await axios.get(isExist.imageUrl, { responseType: "arraybuffer" });
          const bannerBuffer = Buffer.from(response.data);
          const mockupBuffer = await generateGardenMockup(bannerBuffer);
          const mockupUrl = await uploadBufferToS3({
            buffer: mockupBuffer,
            key: `mockups/${Date.now()}-mockup.png`,
            contentType: "image/png",
          });
          updateData.mockupUrl = mockupUrl;
        } catch (err) {
          console.error("Failed to generate mockup from existing image:", err);
        }
      }
    }
  } else {
    // If it's set to NOT readymade, clean up the mockup
    updateData.mockupUrl = null;
    if (isExist.mockupUrl) {
      const oldMockupKey = getS3KeyFromUrl(isExist.mockupUrl);
      if (oldMockupKey) {
        await deleteImageFromS3(oldMockupKey);
      }
    }

    if (file) {
      const fileUrl = await uploadImageToS3(file);
      updateData.imageUrl = fileUrl;

      if (isExist.imageUrl) {
        const oldKey = getS3KeyFromUrl(isExist.imageUrl);
        if (oldKey) {
          await deleteImageFromS3(oldKey);
        }
      }
    }
  }

  const updatedTemplate = await prisma.banner.update({
    where: { id: templateId },
    data: updateData,
  });

  return updatedTemplate;
};

const deleteTemplate = async (templateId: string) => {
  const isExist = await prisma.banner.findUnique({
    where: { id: templateId, isTemplate: true },
  });

  if (!isExist) {
    throw new AppError("Template niet gevonden", httpStatus.NOT_FOUND);
  }

  // 1. Delete associated template reviews to prevent relational constraints block
  await prisma.templateReview.deleteMany({
    where: { templateId },
  });

  // 2. Set sourceTemplateId of copies to null to prevent relational constraints block
  await prisma.banner.updateMany({
    where: { sourceTemplateId: templateId },
    data: { sourceTemplateId: null },
  });

  // 3. Delete background image from S3 (safeguarded to avoid blocking database deletion)
  if (isExist.imageUrl) {
    const key = getS3KeyFromUrl(isExist.imageUrl);
    if (key) {
      try {
        await deleteImageFromS3(key);
      } catch (s3Error) {
        console.error("Failed to delete template image from S3:", s3Error);
      }
    }
  }

  // 4. Delete the template banner itself
  await prisma.banner.delete({
    where: { id: templateId },
  });

  return true;
};

const getAllTemplates = async (
  page: number,
  limit: number,
  skip: number,
  occasion?: string,
  categoryId?: string,
  category?: string,
  isReadymade?: boolean,
) => {
  const where: any = {
    isTemplate: true,
    isReadymade: isReadymade ?? false,
  };

  if (categoryId) {
    where.OR = [
      { templateCategoryId: categoryId },
      { templateCategoryIds: { has: categoryId } },
    ];
  } else if (category) {
    const templateCategory = await prisma.templateCategory.findFirst({
      where: {
        slug: category,
      },
    });

    if (templateCategory) {
      where.OR = [
        { templateCategoryId: templateCategory.id },
        { templateCategoryIds: { has: templateCategory.id } },
      ];
    } else {
      where.occasion = category;
    }
  }

  if (occasion) {
    where.occasion = occasion;
  }

  const [templates, total] = await prisma.$transaction([
    prisma.banner.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
      select: bannerListSelect,
    }),
    prisma.banner.count({ where }),
  ]);

  return {
    templates,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createBackgroundImage = async (data: any) => {
  let name = data.name;

  if (data.data && typeof data.data === "string") {
    try {
      const parsed = JSON.parse(data.data);
      if (parsed.name) {
        name = parsed.name;
      }
    } catch (e) {
      console.error("Failed to parse background data:", e);
    }
  }

  name = name || "Background";

  const backgroundImage = await prisma.backgroundImage.create({
    data: {
      name,
      imageUrl: data.imageUrl,
    },
  });
  return backgroundImage;
};

const deleteBackgroundImage = async (id: string) => {
  await prisma.backgroundImage.delete({
    where: { id },
  });
  return true;
};

const getAllBackgroundImages = async () => {
  const backgrounds = await prisma.backgroundImage.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return backgrounds;
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
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqs,
  createTemplateCategory,
  getAllTemplateCategories,
  updateTemplateCategory,
  deleteTemplateCategory,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplates,
  createBackgroundImage,
  deleteBackgroundImage,
  getAllBackgroundImages,
};
