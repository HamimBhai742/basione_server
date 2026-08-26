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
        throw new AppError(`Gebruiker is ${user.status}`, httpStatus.BAD_REQUEST);
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
        throw new AppError(`Gebruiker is ${user.status}`, httpStatus.BAD_REQUEST);
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

export const checkBlogPublishAuth = () => {
  return async (
    req: Request & { user?: User },
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // 1. Check API Key
      const apiKeyHeader = req.headers["x-api-key"] || req.headers["authorization"];
      const clientApiKey = typeof apiKeyHeader === "string"
        ? (apiKeyHeader.startsWith("Bearer ") ? apiKeyHeader.slice(7) : apiKeyHeader)
        : null;

      if (config.externalBlogApiKey && clientApiKey === config.externalBlogApiKey) {
        // Authenticated via API key.
        // Find an active admin user to associate as author.
        const adminUser = await prisma.user.findFirst({
          where: {
            role: "admin",
            status: "active",
          },
        });

        if (!adminUser) {
          throw new AppError("No active admin user found to associate as author", httpStatus.INTERNAL_SERVER_ERROR);
        }

        req.user = adminUser;
        return next();
      }

      // 2. Fallback to normal JWT authentication
      const token = extractToken(
        req.headers.authorization,
        req.cookies.accessToken,
      );

      if (!token) {
        throw new AppError(
          "Unauthenticated: Provide a valid x-api-key header or admin access token",
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
        throw new AppError("User not found", httpStatus.NOT_FOUND);
      }

      if (!user.isVerified) {
        throw new AppError("User is not verified", httpStatus.BAD_REQUEST);
      }

      if (user.status !== "active") {
        throw new AppError(`User is ${user.status}`, httpStatus.BAD_REQUEST);
      }

      if (user.role !== "admin") {
        throw new AppError(
          "User does not have access to this route",
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

