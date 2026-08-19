import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/AppError";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Always log the full error stack internally for debugging
  console.error("Error caught by global handler:", err);

  let message = "Er is iets misgegaan";
  let statusCode = err.statusCode || 500;
  const errorDetails: any = [];

  if (err instanceof AppError) {
    message = err.message;
    statusCode = err.statusCode;
  } else if (err.name === "ZodError") {
    message = "Validatiefout";
    statusCode = 400;

    err.issues.forEach((error: any) => {
      errorDetails.push({ path: error.path[0], message: error.message });
    });
  } else if (err.name === "PrismaClientValidationError") {
    message = "Validatiefout";
    statusCode = 400;
    const errorMessage = err.message;

    // 🔥 field extract
    const match = errorMessage.match(/Argument `(.*?)` is missing/);

    if (match) {
      errorDetails.push({
        path: match[1],
        message: `${match[1]} is verplicht`,
      });
    } else {
      errorDetails.push({
        path: "",
        message: "Ongeldige gegevens verstrekt",
      });
    }
  } else if (err.name === "PrismaClientKnownRequestError" || err.code?.startsWith?.("P2")) {
    statusCode = 400;

    if (err.code === "P2002") {
      const target: string = Array.isArray(err.meta?.target)
        ? err.meta.target.join(", ")
        : (err.meta?.target as string) ?? "field";
      message = "Er is een conflict opgetreden. Probeer het opnieuw.";
      errorDetails.push({
        path: target,
        message: `Dubbele waarde voor uniek veld: ${target}`,
      });
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Het gevraagde item kon niet worden gevonden.";
    } else {
      message = "Database fout. Probeer het opnieuw.";
    }
  } else {
    // If it's a generic error with a statusCode explicitly set by some middleware/library
    if (err.statusCode) {
      message = err.message || "Er is iets misgegaan";
    } else {
      // In development mode, we can show the raw error message to make debugging easier for developers
      if (process.env.NODE_ENV === "development") {
        message = err.message || "Er is iets misgegaan";
      }
    }
  }

  res.status(statusCode).json({ success: false, message, errorDetails });
};

