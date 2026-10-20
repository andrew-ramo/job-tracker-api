import pino from "pino";
import { env } from "./env";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: env.LOG_LEVEL,
  // In development, use pino-pretty for readable logs. In production, raw JSON.
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});