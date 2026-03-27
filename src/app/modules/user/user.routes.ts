import { Router } from "express";
import { userController } from "./user.controller";
import {
  otpResendZodSchema,
  otpVerifyZodSchema,
  userZodSchema,
} from "./user.zod.schema";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/register",
  validateRequest(userZodSchema),
  userController.registerUser,
);

router.post(
  "/verify-otp",
  validateRequest(otpVerifyZodSchema),
  userController.verifyOtp,
);

router.post(
  "/resend-otp",
  validateRequest(otpResendZodSchema),
  userController.resendOtp,
);

export const userRoutes = router;
