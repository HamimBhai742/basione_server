import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { setCookies } from "../../utils/setCookies";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.loginUser(req.body);

  setCookies(res, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: null,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged out successfully",
    data: null,
  });
});

const resetPassword = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = await authService.resetPassword(
      req.body.userId,
      req.body.password,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password reset successfully",
      data: user,
    });
  },
);

export const authController = {
  loginUser,
  logoutUser,
  resetPassword,
};
