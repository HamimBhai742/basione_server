import { NextFunction, Request, Response } from "express";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let message = err.message || "Something went wrong";
  let statusCode = err.statusCode || 500;
  const errorDetails: any = [];

  if (err.name === "ZodError") {
    message = "Validation error";
    statusCode = 400;

    err.issues.forEach((error: any) => {
      errorDetails.push({ path: error.path[0], message: error.message });
    });
  }
  res.status(statusCode).json({ success: false, message, errorDetails });
};
