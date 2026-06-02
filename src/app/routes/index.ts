import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { bannerRoutes } from "../modules/banner/banner.routes";
import { orderRoutes } from "../modules/order/order.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";
import { adminRoutes } from "../modules/admin/admin.route";
import { decorationRoutes } from "../modules/decorations/decorations.routes";
import { blogRoutes } from "../modules/blog/blog.routes";
import { aggregateRoutes } from "../modules/aggregate/aggregate.routes";
import { chatbotRoutes } from "../modules/chatbot/chatbot.routes";
import { fontRoutes } from "../modules/font/font.routes";
import { shippingRoutes } from "../modules/shipping/shipping.routes";

export const router = Router();

const routes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/banner",
    route: bannerRoutes,
  },
  {
    path: "/order",
    route: orderRoutes,
  },
  {
    path: "/payment",
    route: paymentRoutes,
  },
  {
    path: "/admin",
    route: adminRoutes,
  },
  {
    path: "/decorations",
    route: decorationRoutes,
  },
  {
    path: "/blog",
    route: blogRoutes,
  },
  {
    path: "/aggregate",
    route: aggregateRoutes,
  },
  {
    path: "/chatbot",
    route: chatbotRoutes,
  },
  {
    path: "/fonts",
    route: fontRoutes,
  },
  {
    path: "/shipping",
    route: shippingRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

