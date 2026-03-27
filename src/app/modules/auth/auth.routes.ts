import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { loginUserZodSchema } from "./auth.zod.schema";

const router = Router();

router.post(
  "/login",
  validateRequest(loginUserZodSchema),
  authController.loginUser,
);

export const authRoutes = router;
