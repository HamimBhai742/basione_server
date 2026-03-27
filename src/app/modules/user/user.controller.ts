import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userService } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await userService.registerUser(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "User registered successfully. Please check your email",
      data: user,
    });
  },
);

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.verifyOtp(req.body.otp, req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User verified successfully",
    data: user,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.resendOtp(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent successfully",
    data: user,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.forgotPassword(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent successfully",
    data: user,
  });
});

const verifyForgotOtp = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.verifyForgotOtp(
    req.body.otp,
    req.body.email,
    req.body.token,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User verified successfully",
    data: user,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.resetPassword(
    req.body.token,
    req.body.password,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: user,
  });
});

export const userController = {
  registerUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
};
