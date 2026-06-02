import { prisma } from "../../lib/prisma";

const bannerListSelect = {
  id: true,
  userId: true,
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

const getAggregateData = async (userId?: string) => {
  const [
    templates,
    banners,
    blogs,
    decorations,
    decorationCategories,
    faqs,
    users,
    userProfile,
    userBanners,
    userOrders,
  ] = await Promise.all([
    // 1. Fetch Banner Templates
    prisma.banner.findMany({
      where: { isTemplate: true },
      orderBy: { createdAt: "desc" },
      select: bannerListSelect,
    }),

    // 2. Fetch Recent User Banners (limit to 10 for performance)
    prisma.banner.findMany({
      where: { isTemplate: false },
      orderBy: { createdAt: "desc" },
      select: bannerListSelect,
      take: 10,
    }),

    // 3. Fetch Published Blogs with author info
    prisma.blog.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 4. Fetch Decorations with category info
    prisma.decoration.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // 5. Fetch Decoration Categories
    prisma.decorationCategory.findMany({
      orderBy: { createdAt: "desc" },
    }),

    // 6. Fetch FAQs
    prisma.faq.findMany({
      orderBy: { createdAt: "desc" },
    }),

    // 7. Fetch All Registered Users (safely select non-sensitive fields)
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    // 8. Optional User Profile
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            image: true,
            phone: true,
            location: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : Promise.resolve(null),

    // 9. Optional User Banners
    userId
      ? prisma.banner.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: bannerListSelect,
        })
      : Promise.resolve([]),

    // 10. Optional User Orders
    userId
      ? prisma.order.findMany({
          where: { userId },
          include: {
            banner: true,
            payment: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  // Extract unique blog categories and tags
  const blogCategories = Array.from(
    new Set(blogs.map((b) => b.category).filter(Boolean))
  );
  const blogTags = Array.from(
    new Set(blogs.flatMap((b) => b.tags || []).filter(Boolean))
  );

  const response: any = {
    banners,
    templates,
    blogs,
    blogMetadata: {
      categories: blogCategories,
      tags: blogTags,
    },
    decorations,
    decorationCategories,
    faqs,
    users,
  };

  if (userId && userProfile) {
    response.user = {
      profile: userProfile,
      banners: userBanners,
      orders: userOrders,
    };
  }

  return response;
};

export const aggregateService = {
  getAggregateData,
};
