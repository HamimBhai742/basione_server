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

router.post(
  "/forgot-password",
  validateRequest(forgotPasswordZodSchema),
  userController.forgotPassword,
);

router.post("/verify-forgot-otp", userController.verifyForgotOtp);

router.post("/reset-password", userController.resetPassword);

router.post("/resend-forgot-password-otp", userController.resendForgotPassOtp);

router.get("/me", checkAuth("user"), userController.getMyProfile);

router.patch(
  "/update-profile",
  checkAuth("user"),
  upload.single("file"),
  validateRequest(userUpdateZodSchema),
  userController.updateUser,
);

export const userRoutes = router;
