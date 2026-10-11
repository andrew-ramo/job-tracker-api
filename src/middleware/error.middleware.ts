import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.util";
import { env } from "../config/env";

interface PrismaKnownError extends Error {
  code?: string;
}

export function errorHandler(
  err: Error,
  req: Request, // Note: removed the underscore so we can use req.log
  res: Response,
  _next: NextFunction
): void {
  // 1) Our own ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // 2) Prisma known request errors
  const prismaError = err as PrismaKnownError;
  if (prismaError.code === "P2002") {
    res.status(409).json({
      success: false,
      error: { message: "Unique constraint violated", statusCode: 409 },
    });
    return;
  }
  if (prismaError.code === "P2025") {
    res.status(404).json({
      success: false,
      error: { message: "Resource not found", statusCode: 404 },
    });
    return;
  }

  // 3) Unknown error
  // req.log is provided by pino-http middleware
  req.log.error({ err }, "Unhandled error occurred");

  res.status(500).json({
    success: false,
    error: {
      message:
        env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message || "Internal server error",
      statusCode: 500,
    },
  });
}