import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/AppError";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/verifyToken";
import config from "../../config";
import { prisma } from "../lib/prisma";

export const checkAuth = (...role: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = req.headers.authorization || req.cookies.accessToken;
      if (!token) {
        throw new AppError("Token not found", httpStatus.UNAUTHORIZED);
      }

      const decoded = verifyToken(token, config.jwt.secret);

      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
      });

      if (!user) {
        throw new AppError("User not found", httpStatus.NOT_FOUND);
      }

      if (!user.isVerified) {
        throw new AppError("User is not verified", httpStatus.BAD_REQUEST);
      }

      if (user.status !== "active") {
        throw new AppError(`User is ${user.status}`, httpStatus.BAD_REQUEST);
      }

      if (!role.includes(user.role)) {
        throw new AppError(
          "User is not authorized to access this route",
          httpStatus.FORBIDDEN,
        );
      }
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};
