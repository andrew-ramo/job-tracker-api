import type { Request, Response, NextFunction } from "express";
import { type ZodTypeAny } from "zod";
import { ApiError } from "../utils/apiError.util";

export function validate<T extends ZodTypeAny>(
  schema: T,
  target: "body" | "query" = "body"
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || target,
        message: issue.message,
      }));
      return next(ApiError.badRequest(JSON.stringify(details)));
    }

    if (target === "body") {
      req.body = result.data;
    } else {
      // Express 5: req.query is read-only. Store validated data separately.
      (req as Request & { validatedQuery?: unknown }).validatedQuery =
        result.data;
    }

    next();
  };
}