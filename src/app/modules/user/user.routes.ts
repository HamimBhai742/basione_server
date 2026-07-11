import { Router } from "express";
import { userController } from "./user.controller";
import {
  forgotPasswordZodSchema,
  otpResendZodSchema,
  otpVerifyZodSchema,
  userUpdateZodSchema,
  userZodSchema,
} from "./user.zod.schema";
import { validateRequest } from "../../middleware/validateRequest";
import { checkAuth } from "../../middleware/checkAuth";
import { upload } from "../../middleware/upload";
import { authRateLimiter, otpRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validateRequest(userZodSchema),
  userController.registerUser,
);

router.post(
  "/verify-otp",
  otpRateLimiter,
  validateRequest(otpVerifyZodSchema),
  userController.verifyOtp,
);

router.post(
  "/resend-otp",
  otpRateLimiter,
  validateRequest(otpResendZodSchema),
  userController.resendOtp,
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest(forgotPasswordZodSchema),
  userController.forgotPassword,
);

router.post("/verify-forgot-otp", otpRateLimiter, userController.verifyForgotOtp);

router.post("/resend-forgot-password-otp", otpRateLimiter, userController.resendForgotPassOtp);

router.get("/me", checkAuth("user", "admin"), userController.getMyProfile);

router.patch(
  "/update-profile",
  checkAuth("user", "admin"),
  upload.single("file"),
  validateRequest(userUpdateZodSchema),
  userController.updateUser,
);

router.get("/total-active-users", userController.getTotalActiveUsers);

export const userRoutes = router;
