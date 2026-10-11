import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.util";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
}