import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../error/AppError";
import httpStatus from "http-status";

export const verifyToken = (token: any, secret: any) => {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Token has expired!", httpStatus.UNAUTHORIZED);
    }
    throw new AppError("Invalid token!", httpStatus.BAD_REQUEST);
  }
};
