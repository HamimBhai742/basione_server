import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../error/AppError";
import httpStatus from "http-status";

export const verifyToken = (token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Token is verlopen!", httpStatus.UNAUTHORIZED);
    }
    throw new AppError("Ongeldig token!", httpStatus.BAD_REQUEST);
  }
};
