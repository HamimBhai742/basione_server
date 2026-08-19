import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { loginUserZodSchema } from "./auth.zod.schema";
import { checkAuth } from "../../middleware/checkAuth";
import { authRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  validateRequest(loginUserZodSchema),
  authController.loginUser,
);

router.post("/logout", checkAuth("user", "admin"), authController.logoutUser);

router.post("/refresh", authController.refreshToken);

router.post("/reset-password", authRateLimiter, checkAuth("user", "admin"), authController.resetPassword);

export const authRoutes = router;
