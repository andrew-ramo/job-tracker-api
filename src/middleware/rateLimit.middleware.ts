import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env";

const isDev = env.NODE_ENV === "development";

const baseConfig: Partial<Options> = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
};

export const generalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Temporarily increased production limit to 1000 so we don't lock out during frontend development
  limit: isDev ? 1000 : 1000, 
  message: {
    success: false,
    error: {
      message: "Too many requests. Please try again later.",
      statusCode: 429,
    },
  },
});

export const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, 
  limit: isDev ? 100 : 20, // 20 attempts in prod is safe enough for testing
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      message: "Too many authentication attempts. Please try again in 15 minutes.",
      statusCode: 429,
    },
  },
});