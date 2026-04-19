import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { bannerRoutes } from "../modules/banner/banner.routes";
import { orderRoutes } from "../modules/order/order.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";
import { adminRoutes } from "../modules/admin/admin.route";

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
  }
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});
