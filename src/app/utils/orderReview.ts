import config from "../../config";
import { prisma } from "../lib/prisma";
import { orderDeliveryCompleteTemplate } from "./emailTemplates/orderDeliveryTemplate";
import { formatAmsterdamDateTime } from "./deliveryCalculator";

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

  const templateId = order.banner
    ? (order.banner.sourceTemplateId
      ? order.banner.sourceTemplateId
      : order.banner.isTemplate
        ? order.banner.id
        : null)
    : null;

  const reviewLink =
    templateId && !order.isGuest && order.userId
      ? buildOrderReviewLink(order.id)
      : undefined;
  const customerName =
    order.user?.name || order.guestName || order.addresses?.name || "Customer";
  const customerEmail =
    order.user?.email || order.guestEmail || order.addresses?.email;

  if (!customerEmail) {
    return;
  }

  await orderDeliveryCompleteTemplate(
    customerName,
    customerEmail,
    "Bestelling geleverd",
    {
      orderNumber: order.trackingNumber || order.id,
      deliveredDate: formatAmsterdamDateTime(new Date()),
      items: [
        {
          name: order.banner?.name || order.banner?.headline || "Banner",
          quantity: order.quantity,
          price: order.banner?.price || 0,
          image: order.banner?.imageUrl || "",
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
