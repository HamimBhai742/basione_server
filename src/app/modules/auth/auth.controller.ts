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
    message: "Gebruiker succesvol ingelogd",
    data: {
      ...user.user,
      accessToken: user.accessToken,
    },
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Gebruiker succesvol uitgelogd",
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
      message: "Wachtwoord succesvol opnieuw ingesteld",
      data: user,
    });
  },
);

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  const result = await authService.refreshAccessToken(token);

  setCookies(res, result);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Toegangstoken succesvol vernieuwd",
    data: result,
  });
});

export const authController = {
  loginUser,
  logoutUser,
  resetPassword,
  refreshToken,
};
