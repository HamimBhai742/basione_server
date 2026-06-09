import config from "../../config";
import { prisma } from "../lib/prisma";
import { orderDeliveryCompleteTemplate } from "./emailTemplates/orderDeliveryTemplate";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const buildOrderReviewLink = (orderId: string) => {
  const configuredReviewBaseUrl = config.reviewBaseUrl?.trim();
  const clientUrl = config.client_url?.trim();
  const baseUrl = configuredReviewBaseUrl || clientUrl;

  if (!baseUrl) {
    return undefined;
  }

  if (configuredReviewBaseUrl?.includes(":orderId")) {
    return configuredReviewBaseUrl.replace(":orderId", orderId);
  }

  return `${trimTrailingSlash(baseUrl)}/profile/${orderId}`;
};

export const sendDeliveredOrderReviewEmail = async (orderId: string) => {
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
    return;
  }

  const templateId = order.banner.sourceTemplateId
    ? order.banner.sourceTemplateId
    : order.banner.isTemplate
      ? order.banner.id
      : null;

  const reviewLink = templateId ? buildOrderReviewLink(order.id) : undefined;

  await orderDeliveryCompleteTemplate(
    order.user.name,
    order.user.email,
    "Bestelling geleverd",
    {
      orderNumber: order.trackingNumber || order.id,
      deliveredDate: new Date().toLocaleString(),
      items: [
        {
          name: order.banner.name || order.banner.headline || "Banner",
          quantity: order.quantity,
          price: order.banner.price,
          image: order.banner.imageUrl,
        },
      ],
      totalAmount: order.total,
      deliveryAddress: order.addresses?.address
        ? order.addresses.address
        : `${order.addresses?.houseNumber || ""} ${order.addresses?.street || ""} ${order.addresses?.city || ""}, ${order.addresses?.zipCode || ""}`.trim(),
      reviewLink,
    },
  );
};
