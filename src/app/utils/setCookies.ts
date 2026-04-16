import { Response } from "express";
import config from "../../config";

export const setCookies = (res: Response, token: { accessToken: string }) => {
  if (token.accessToken) {
    res.cookie("accessToken", token.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
  }
};
