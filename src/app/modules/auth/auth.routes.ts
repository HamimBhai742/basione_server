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

router.post("/logout", checkAuth("user"), authController.logoutUser);

export const authRoutes = router;
