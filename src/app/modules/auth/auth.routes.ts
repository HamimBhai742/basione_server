import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { loginUserZodSchema } from "./auth.zod.schema";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post(
  "/login",
  validateRequest(loginUserZodSchema),
  authController.loginUser,
);

router.post("/logout", checkAuth("user", "admin"), authController.logoutUser);

router.post("/reset-password", checkAuth("user"), authController.resetPassword);

export const authRoutes = router;
