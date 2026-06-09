import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import { orderUserSearchableFields } from "./admin.contain";
import httpStatus from "http-status";
import { cancledOrder } from "../order/order.service";
import { orderRefundedTemplate } from "../../utils/emailTemplates/orderRefunded";
import { orderReadyTemplate } from "../../utils/emailTemplates/orderReadyTemplate";
import { orderShippedTemplate } from "../../utils/emailTemplates/orderShipped";
import { stat } from "fs";
import { uploadImageToS3 } from "../../utils/uploadAws";
import { getS3KeyFromUrl } from "../../utils/getS3KeyFromUrl";
import { deleteImageFromS3 } from "../../utils/deleteImageFromS3";
import { generateUniqueBannerSlug } from "../banner/banner.service";
import { QlsCarrierCode, shippingService } from "../shipping/shipping.service";
import { sendDeliveredOrderReviewEmail } from "../../utils/orderReview";

const bannerListSelect = {
  id: true,
  userId: true,
  templateCategoryId: true,
  templateCategory: true,
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
  status: true,
  generationId: true,
  createdAt: true,
  updatedAt: true,
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

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: where,
      include: {
        banner: true,
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
      order.user.name,
      order.user.email,
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
      order.user.name,
      order.user.email,
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
        shipment?.trackingUrl || `http://localhost:3000/profile/${orderId}`,

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
  if (file) {
    imageUrl = await uploadImageToS3(file);
  } else if (parsedData.imageUrl) {
    imageUrl = parsedData.imageUrl;
  } else {
    throw new AppError("Template-afbeelding is verplicht.", 400);
  }

  const areaM2 = (width / 100) * (height / 100);
  const pricePerM2 = areaM2 < 1 ? 25 : 20;
  const calculatedPrice = areaM2 * pricePerM2;
  const finalPrice = Math.max(calculatedPrice, 12);

  const headline = parsedData.headline || "Template Headline";
  const slug = parsedData.slug || await generateUniqueBannerSlug(headline);
  const templateCategory = await resolveTemplateCategory(parsedData);

  const template = await prisma.banner.create({
    data: {
      templateCategoryId: templateCategory?.id || null,
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
      variant: 0,
      status: "GENERATED",
      canvasJSON: parsedData.canvasJSON || null,
      metaTitle: parsedData.metaTitle || null,
      metaDescription: parsedData.metaDescription || null,
      h1Title: parsedData.h1Title || null,
      introText: parsedData.introText || null,
      seoDescription: parsedData.seoDescription || null,
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
  if (
    parsedData.templateCategoryId !== undefined ||
    parsedData.categoryId !== undefined ||
    parsedData.templateCategorySlug !== undefined ||
    parsedData.category !== undefined
  ) {
    const templateCategory = await resolveTemplateCategory(parsedData);
    updateData.templateCategoryId = templateCategory?.id || null;
    if (parsedData.occasion === undefined && templateCategory) {
      updateData.occasion = templateCategory.slug;
    }
  }
  if (parsedData.style !== undefined) updateData.style = parsedData.style;
  if (parsedData.headline !== undefined) {
    updateData.headline = parsedData.headline;
    if (parsedData.slug) {
      updateData.slug = parsedData.slug;
    } else if (parsedData.headline !== isExist.headline) {
      updateData.slug = await generateUniqueBannerSlug(parsedData.headline, templateId);
    }
  } else if (parsedData.slug !== undefined) {
    updateData.slug = parsedData.slug;
  }
  if (parsedData.name !== undefined) updateData.name = parsedData.name;
  if (parsedData.description !== undefined) updateData.description = parsedData.description;
  if (parsedData.sizeType !== undefined) updateData.sizeType = parsedData.sizeType;
  if (parsedData.sizeLabel !== undefined) updateData.sizeLabel = parsedData.sizeLabel;
  if (parsedData.canvasJSON !== undefined) updateData.canvasJSON = parsedData.canvasJSON;
  if (parsedData.metaTitle !== undefined) updateData.metaTitle = parsedData.metaTitle;
  if (parsedData.metaDescription !== undefined) updateData.metaDescription = parsedData.metaDescription;
  if (parsedData.h1Title !== undefined) updateData.h1Title = parsedData.h1Title;
  if (parsedData.introText !== undefined) updateData.introText = parsedData.introText;
  if (parsedData.seoDescription !== undefined) updateData.seoDescription = parsedData.seoDescription;

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

  if (parsedData.width !== undefined || parsedData.height !== undefined) {
    if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
      throw new AppError("Ongeldige template-afmetingen.", 400);
    }
    const areaM2 = (width / 100) * (height / 100);
    const pricePerM2 = areaM2 < 1 ? 25 : 20;
    const calculatedPrice = areaM2 * pricePerM2;
    const finalPrice = Math.max(calculatedPrice, 12);
    updateData.price = Number(finalPrice.toFixed(2));
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

  if (isExist.imageUrl) {
    const key = getS3KeyFromUrl(isExist.imageUrl);
    if (key) {
      await deleteImageFromS3(key);
    }
  }

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
) => {
  const where: any = {
    isTemplate: true,
  };

  if (categoryId) {
    where.templateCategoryId = categoryId;
  } else if (category) {
    const templateCategory = await prisma.templateCategory.findFirst({
      where: {
        slug: category,
      },
    });

    if (templateCategory) {
      where.templateCategoryId = templateCategory.id;
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
};
