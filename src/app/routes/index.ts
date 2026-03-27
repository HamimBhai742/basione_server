import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";

export const router = Router();

const routes = [
  {
    path: "/user",
    route: userRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});
