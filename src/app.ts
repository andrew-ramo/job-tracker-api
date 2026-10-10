import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./config/swagger";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./config/logger";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import applicationRoutes from "./routes/application.routes";
import { notFoundHandler } from "./middleware/not-found.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { generalLimiter } from "./middleware/rateLimit.middleware";

const app = express();

// Security & parsing
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // Let the client read rate-limit headers so it can back off gracefully
    exposedHeaders: [
      "RateLimit",
      "RateLimit-Policy",
    ],
    maxAge: 86400, // Cache preflight for 24 hours
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(
  pinoHttp({
    logger,
    autoLogging: env.NODE_ENV !== "test", // Don't spam logs during tests
  })
);
// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Rate limit all /api routes
app.use("/api", generalLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Root
app.get("/", (_req, res) => {
  res.json({
    message: "Job Tracker API",
    version: "v1",
    docs: "/api/v1",
  });
});

// API v1
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/applications", applicationRoutes);

// 404 + error handlers (MUST be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;