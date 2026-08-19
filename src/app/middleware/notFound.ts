import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NIET GEVONDEN!",
    error: {
      path: req.originalUrl,
      message: "Het door u opgevraagde pad is niet gevonden!",
    },
  });
};
