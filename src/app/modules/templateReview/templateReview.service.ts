import httpStatus from "http-status";
import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";

interface CreateTemplateReviewPayload {
  orderId: string;
  rating: number;
  comment?: string;
}

const roundToTwo = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const getTemplateReviewSummary = async (templateId: string) => {
  const [aggregate, reviews] = await Promise.all([
    prisma.templateReview.aggregate({
      where: {
        templateId,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    }),
    prisma.templateReview.findMany({
      where: {
        templateId,
      },
      select: {
        rating: true,
      },
    }),
  ]);

  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));

  return {
    averageRating: aggregate._avg.rating
      ? roundToTwo(aggregate._avg.rating)
      : 0,
    totalReviews: aggregate._count.rating,
    ratingBreakdown,
  };
};

const ensureTemplate = async (templateId: string) => {
  const template = await prisma.banner.findFirst({
    where: {
      id: templateId,
      isTemplate: true,
    },
  });

  if (!template) {
    throw new AppError("Template niet gevonden", httpStatus.NOT_FOUND);
  }

  return template;
};

const resolveReviewableTemplateFromOrder = async (
  userId: string,
  orderId: string,
) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      banner: true,
    },
  });

  if (!order) {
    throw new AppError("Bestelling niet gevonden", httpStatus.NOT_FOUND);
  }

  if (order.userId !== userId) {
    throw new AppError("Je bent niet geautoriseerd", httpStatus.UNAUTHORIZED);
  }

  if (order.paymentStatus !== "paid" || order.status !== "delivered") {
    throw new AppError(
      "Je kunt pas een review plaatsen nadat de bestelling is afgerond.",
      httpStatus.BAD_REQUEST,
    );
  }

  const templateId = order.banner.sourceTemplateId
    ? order.banner.sourceTemplateId
    : order.banner.isTemplate
      ? order.banner.id
      : null;

  if (!templateId) {
    throw new AppError(
      "Deze bestelling is niet op basis van een template gemaakt.",
      httpStatus.BAD_REQUEST,
    );
  }

  await ensureTemplate(templateId);

  return {
    order,
    templateId,
  };
};

const createOrUpdateReview = async (
  userId: string,
  payload: CreateTemplateReviewPayload,
) => {
  const { order, templateId } = await resolveReviewableTemplateFromOrder(
    userId,
    payload.orderId,
  );

  const comment = payload.comment?.trim() || null;
  const existingReview = await prisma.templateReview.findUnique({
    where: {
      orderId: order.id,
    },
  });

  if (existingReview) {
    throw new AppError(
      "Voor deze bestelling is al een review geplaatst.",
      httpStatus.BAD_REQUEST,
    );
  }

  return prisma.templateReview.create({
    data: {
      rating: payload.rating,
      comment,
      templateId,
      orderId: order.id,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
};

const getTemplateReviews = async (
  templateId: string,
  page: number,
  limit: number,
  skip: number,
) => {
  await ensureTemplate(templateId);

  const [reviews, total, summary] = await Promise.all([
    prisma.templateReview.findMany({
      where: {
        templateId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.templateReview.count({
      where: {
        templateId,
      },
    }),
    getTemplateReviewSummary(templateId),
  ]);

  return {
    reviews,
    summary,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMyTemplateReviewEligibility = async (
  userId: string,
  templateId: string,
) => {
  await ensureTemplate(templateId);

  const order = await prisma.order.findFirst({
    where: {
      userId,
      paymentStatus: "paid",
      status: "delivered",
      banner: {
        OR: [
          {
            sourceTemplateId: templateId,
          },
          {
            id: templateId,
            isTemplate: true,
          },
        ],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      templateReview: true,
    },
  });

  return {
    canReview: Boolean(order && !order.templateReview),
    orderId: order?.id || null,
    review: order?.templateReview || null,
  };
};

export const templateReviewService = {
  createOrUpdateReview,
  getTemplateReviews,
  getTemplateReviewSummary,
  getMyTemplateReviewEligibility,
};
