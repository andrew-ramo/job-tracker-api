import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env";

// A sensible default: 100 requests per 15 minutes per IP.
// In development we relax it so we don't lock ourselves out while testing.
const isDev = env.NODE_ENV === "development";

const baseConfig: Partial<Options> = {
  standardHeaders: "draft-8", // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,       // Disable the old `X-RateLimit-*` headers
  // In dev, be generous. In production, stricter.
   skip: () => env.NODE_ENV === "test",
};

/**
 * General purpose limiter — applied globally to the API.
 * Protects against scraping and abuse without blocking normal use.
 */
export const generalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDev ? 1000 : 100,
  message: {
    success: false,
    error: {
      message: "Too many requests. Please try again later.",
      statusCode: 429,
    },
  },
});

/**
 * Strict limiter for authentication endpoints.
 * Prevents brute-force attacks on /login and abuse of /register and /refresh.
 */
export const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDev ? 100 : 10, // 10 attempts per 15 min in prod
  skipSuccessfulRequests: true, // Successful logins don't count toward the limit
  message: {
    success: false,
    error: {
      message: "Too many authentication attempts. Please try again in 15 minutes.",
      statusCode: 429,
    },
  },
});