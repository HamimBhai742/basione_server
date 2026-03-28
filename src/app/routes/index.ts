import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { designRoutes } from "../modules/design/design.routes";

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
    path: "/design",
    route: designRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});
