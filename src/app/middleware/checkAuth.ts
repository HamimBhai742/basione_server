import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/AppError";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/verifyToken";
import config from "../../config";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";

const extractToken = (authHeader?: string, cookieToken?: string): string | null => {
  if (authHeader) {
    return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  }
  return cookieToken || null;
};

export const checkAuth = (...role: string[]) => {
  return async (
    req: Request & { user?: User },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = extractToken(
        req.headers.authorization,
        req.cookies.accessToken,
      );

      if (!token) {
        throw new AppError(
          "Gebruiker is niet geauthenticeerd om toegang te krijgen tot deze route",
          httpStatus.UNAUTHORIZED,
        );
      }

      const decoded = verifyToken(token, config.jwt.secret!);

      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
      });

      if (!user) {
        throw new AppError("Gebruiker niet gevonden", httpStatus.NOT_FOUND);
      }

      if (!user.isVerified) {
        throw new AppError("Gebruiker is niet geverifieerd", httpStatus.BAD_REQUEST);
      }

      if (user.status !== "active") {
        throw new AppError(`User is ${user.status}`, httpStatus.BAD_REQUEST);
      }

      if (!role.includes(user.role)) {
        throw new AppError(
          "Gebruiker heeft geen toegang tot deze route",
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

export const optionalAuth = (...role: string[]) => {
  return async (
    req: Request & { user?: User },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const token = extractToken(
        req.headers.authorization,
        req.cookies.accessToken,
      );

      if (!token) {
        return next();
      }

      const decoded = verifyToken(token, config.jwt.secret!);

      const user = await prisma.user.findUnique({
        where: {
          email: decoded.email,
        },
      });

      if (!user) {
        throw new AppError("Gebruiker niet gevonden", httpStatus.NOT_FOUND);
      }

      if (!user.isVerified) {
        throw new AppError("Gebruiker is niet geverifieerd", httpStatus.BAD_REQUEST);
      }

      if (user.status !== "active") {
        throw new AppError(`User is ${user.status}`, httpStatus.BAD_REQUEST);
      }

      if (role.length > 0 && !role.includes(user.role)) {
        throw new AppError(
          "Gebruiker heeft geen toegang tot deze route",
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
