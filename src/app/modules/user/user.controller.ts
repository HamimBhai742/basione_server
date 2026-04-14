import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userService } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { uploadToCloudinary } from "../../utils/uploadCloudinary";

export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string; // ISO date string
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  asset_folder: string;
  display_name: string;
  original_filename: string;
  api_key: string;
}

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.registerUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully. Please check your email",
    data: user,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.verifyOtp(req.body.otp, req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User verified successfully",
    data: null,
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

const resendForgotPassOtp = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.resendForgotPassOtp(req.body.email);

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

const getMyProfile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = await userService.getMyProfile(req.user.id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  },
);

const updateUser = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    if (req.file) {
      const result = (await uploadToCloudinary(
        req.file as Express.Multer.File,
      )) as CloudinaryUploadResponse;
      if (result?.secure_url) {
        req.body.image = result.secure_url;
      }
    }
    const user = await userService.updateUser(req.user.id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User profile updated successfully",
      data: user,
    });
  },
);

export const userController = {
  registerUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyForgotOtp,
  resendForgotPassOtp,
  getMyProfile,
  updateUser,
};
