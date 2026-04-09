import { Response } from "express";

export const setCookies = (res: Response, token: { accessToken: string }) => {
  if (token.accessToken) {
    res.cookie("accessToken", token.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production when using HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });
  }
};
