import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { setCookies } from "../../utils/setCookies";
import { AppError } from "../../error/AppError";

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
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Gebruiker succesvol uitgelogd",
    data: null,
  });
});

const resetPassword = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    if (!req.user || req.user.id !== req.body.userId) {
      throw new AppError("Je bent niet geautoriseerd", httpStatus.FORBIDDEN);
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    if (!token) {
      throw new AppError("Token is verplicht", httpStatus.BAD_REQUEST);
    }

    const user = await authService.resetPassword(
      req.body.userId,
      req.body.password,
      token,
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
