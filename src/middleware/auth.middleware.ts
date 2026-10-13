import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError.util";
import { verifyAccessToken } from "../utils/jwt.util";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing or malformed Authorization header"));
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    return next(ApiError.unauthorized("Empty token"));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}