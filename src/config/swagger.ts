import { z } from "zod";
import { 
  registerSchema, 
  loginSchema, 
  refreshSchema,
  applicationStatusSchema 
} from "../schemas";

// Helper to convert a Zod schema to an OpenAPI schema object
const zodToOpenApiSchema = (schema: z.ZodTypeAny) => {
  return z.toJSONSchema(schema, { target: "openapi-3.0" });
};

// Build the OpenAPI specification object manually
export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Job Tracker API",
    version: "1.0.0",
    description: "REST API for managing job applications",
  },
  servers: [{ url: "http://localhost:5000" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RegisterInput: zodToOpenApiSchema(registerSchema),
      LoginInput: zodToOpenApiSchema(loginSchema),
      RefreshInput: zodToOpenApiSchema(refreshSchema),
      Status: zodToOpenApiSchema(applicationStatusSchema),
      
      // Manual definitions for Application (to avoid Zod Date JSON Schema error)
      CreateApplicationInput: {
        type: "object",
        properties: {
          company: { type: "string", description: "Company is required" },
          role: { type: "string", description: "Role is required" },
          status: { type: "string", enum: ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"], default: "APPLIED" },
          appliedDate: { type: "string", format: "date-time", description: "Date of application (optional)" },
          notes: { type: "string", description: "Additional notes (optional)" },
        },
        required: ["company", "role"],
      },
      UpdateApplicationInput: {
        type: "object",
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          status: { type: "string", enum: ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"] },
          appliedDate: { type: "string", format: "date-time" },
          notes: { type: "string", nullable: true },
        },
      },
    },
  },
  paths: {
    // --- AUTH ---
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" },
            },
          },
        },
        responses: {
          "201": { description: "User registered successfully" },
          "400": { description: "Invalid input" },
          "409": { description: "Email already exists" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshInput" },
            },
          },
        },
        responses: {
          "200": { description: "Tokens refreshed successfully" },
          "401": { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (revoke refresh token)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshInput" },
            },
          },
        },
        responses: {
          "204": { description: "Logged out successfully" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "User profile" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    // --- APPLICATIONS ---
    "/api/v1/applications": {
      post: {
        tags: ["Applications"],
        summary: "Create a new job application",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateApplicationInput" },
            },
          },
        },
        responses: {
          "201": { description: "Application created" },
          "401": { description: "Unauthorized" },
        },
      },
      get: {
        tags: ["Applications"],
        summary: "List job applications with pagination and filtering",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: { $ref: "#/components/schemas/Status" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "List of applications" },
        },
      },
    },
    "/api/v1/applications/{id}": {
      get: {
        tags: ["Applications"],
        summary: "Get a single application by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Application details" },
          "404": { description: "Application not found" },
        },
      },
      patch: {
        tags: ["Applications"],
        summary: "Update an application",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateApplicationInput" },
            },
          },
        },
        responses: {
          "200": { description: "Application updated" },
          "404": { description: "Application not found" },
        },
      },
      delete: {
        tags: ["Applications"],
        summary: "Delete an application",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": { description: "Application deleted" },
          "404": { description: "Application not found" },
        },
      },
    },
  },
};