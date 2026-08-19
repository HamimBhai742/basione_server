import { Response } from "express";
import config from "../../config";

const parseExpiryToMs = (expiryStr = "15m"): number => {
  const match = expiryStr.match(/^(\d+)([mds])$/);
  if (!match) return 15 * 60 * 1000;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case "m":
      return val * 60 * 1000;
    case "d":
      return val * 24 * 60 * 60 * 1000;
    case "s":
      return val * 1000;
    default:
      return val * 60 * 1000;
  }
};

export const setCookies = (
  res: Response,
  token: { accessToken: string; refreshToken?: string },
) => {
  const isProd = config.NODE_ENV === "production";

  if (token.accessToken) {
    const accessMaxAge = parseExpiryToMs(config.jwt.expire_in);
    res.cookie("accessToken", token.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: accessMaxAge,
    });
  }

  if (token.refreshToken) {
    const refreshMaxAge = parseExpiryToMs(config.jwt.refresh_expire_in);
    res.cookie("refreshToken", token.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: refreshMaxAge,
    });
  }
};
