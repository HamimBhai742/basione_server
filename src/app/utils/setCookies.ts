import { Response } from "express";
import config from "../../config";

export const setCookies = (res: Response, token: { accessToken: string }) => {
  if (token.accessToken) {
    res.cookie("accessToken", token.accessToken, {
      httpOnly: true,
      secure: true, // Set to true in production when using HTTPS
      sameSite:"none",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });
  }
};
