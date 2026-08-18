import axios from "axios";
import config from "../../../config";

interface CachedShopReviews {
  data: any;
  expiration: number;
}
const cachedShopReviewsMap: Record<string, CachedShopReviews> = {};
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

export interface WebwinkelKeurInvitePayload {
  email: string;
  order: string;
  delay: number;
  customer_name: string;
  order_total?: number;
  with_product_reviews?: number;
  with_shop_reviews?: number;
  order_data?: {
    products: Array<{
      id: string;
      name: string;
      url: string;
      image_url?: string;
    }>;
  };
  client: string;
}

const sendReviewInvitation = async (order: any) => {
  const shopId = config.webwinkelkeur.shopId;
  const apiKey = config.webwinkelkeur.apiKey;

  if (!shopId || !apiKey) {
    console.error("WebwinkelKeur configuration is missing. Cannot send review invitation.");
    return;
  }

  const customerName =
    order.user?.name || order.guestName || order.addresses?.name || "Customer";
  const customerEmail =
    order.user?.email || order.guestEmail || order.addresses?.email;

  if (!customerEmail) {
    console.error(`No email found for order ${order.id}. WebwinkelKeur invitation skipped.`);
    return;
  }

  // Construct optional products data
  const products: any[] = [];
  if (order.banner) {
    const targetProductId = order.banner.sourceTemplateId || order.banner.id;
    products.push({
      id: targetProductId,
      name: order.banner.name || (order.banner.occasion ? `${order.banner.occasion} Banner` : "Banner"),
      url: `${config.client_url}/templates/${order.banner.slug || targetProductId}`,
      image_url: order.banner.imageUrl || "",
    });
  }

  const payload: WebwinkelKeurInvitePayload = {
    email: customerEmail,
    order: order.id,
    delay: 5, // Send 5 days after delivery
    customer_name: customerName,
    order_total: order.total,
    with_product_reviews: 1,
    with_shop_reviews: 1,
    client: "Basione",
  };

  if (products.length > 0) {
    payload.order_data = { products };
  }

  try {
    const url = `https://dashboard.webwinkelkeur.nl/api/1.0/invitations.json?id=${shopId}&code=${apiKey}`;
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.status === "success") {
      // console.log(`WebwinkelKeur invitation successfully queued for order ${order.id}:`, response.data.message);
    } else {
      console.warn(`WebwinkelKeur invitation warning for order ${order.id}:`, response.data?.message || response.data);
    }
  } catch (error: any) {
    console.error(
      `Failed to send WebwinkelKeur invitation for order ${order.id}:`,
      error.response?.data || error.message,
    );
  }
};

const getShopReviews = async (limit = 20, offset = 0) => {
  const shopId = config.webwinkelkeur.shopId;
  const apiKey = config.webwinkelkeur.apiKey;

  if (!shopId || !apiKey) {
    console.warn("WebwinkelKeur configuration is missing. Cannot fetch reviews.");
    return { status: "error", message: "WebwinkelKeur configuration is missing", ratings: [] };
  }

  const now = Date.now();
  const cacheKey = `${limit}_${offset}`;
  const cached = cachedShopReviewsMap[cacheKey];

  if (cached && now < cached.expiration) {
    return cached.data;
  }

  try {
    const url = `https://dashboard.webwinkelkeur.nl/api/1.0/ratings.json`;
    const response = await axios.get(url, {
      params: {
        id: shopId,
        code: apiKey,
        limit,
        offset,
      },
    });

    if (response.data && response.data.status === "success") {
      cachedShopReviewsMap[cacheKey] = {
        data: response.data,
        expiration: now + CACHE_DURATION,
      };
      return response.data;
    }

    return response.data || { status: "error", message: "Failed to retrieve ratings", ratings: [] };
  } catch (error: any) {
    console.error("Error fetching WebwinkelKeur reviews:", error.response?.data || error.message);
    if (cached) {
      // console.log("Serving stale cached WebwinkelKeur reviews as fallback");
      return cached.data;
    }
    return { status: "error", message: error.message, ratings: [] };
  }
};

interface CachedProductReviews {
  data: any;
  expiration: number;
}
const cachedProductReviewsMap: Record<string, CachedProductReviews> = {};

const getProductReviews = async (productId: string, limit = 20, offset = 0) => {
  const shopId = config.webwinkelkeur.shopId;
  const apiKey = config.webwinkelkeur.apiKey;

  if (!shopId || !apiKey) {
    console.warn("WebwinkelKeur configuration is missing. Cannot fetch product reviews.");
    return { status: "error", message: "WebwinkelKeur configuration is missing", product_reviews: [] };
  }

  const now = Date.now();
  const cacheKey = `${productId}_${limit}_${offset}`;
  const cached = cachedProductReviewsMap[cacheKey];

  if (cached && now < cached.expiration) {
    return cached.data;
  }

  try {
    const url = `https://dashboard.webwinkelkeur.nl/api/1.0/product_reviews.json`;
    const response = await axios.get(url, {
      params: {
        id: shopId,
        code: apiKey,
        product_id: productId,
        limit,
        offset,
      },
    });

    if (response.data) {
      cachedProductReviewsMap[cacheKey] = {
        data: response.data,
        expiration: now + CACHE_DURATION,
      };
      return response.data;
    }

    return { total: 0, product_reviews: [] };
  } catch (error: any) {
    console.error(`Error fetching WebwinkelKeur product reviews for ${productId}:`, error.response?.data || error.message);
    if (cached) {
      // console.log(`Serving stale cached WebwinkelKeur product reviews for ${productId} as fallback`);
      return cached.data;
    }
    return { status: "error", message: error.message, product_reviews: [] };
  }
};

export const webwinkelkeurService = {
  sendReviewInvitation,
  getShopReviews,
  getProductReviews,
};
