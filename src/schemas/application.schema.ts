import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
]);

export const createApplicationSchema = z.object({
  company: z
    .string()
    .min(1, "Company is required")
    .max(120, "Company is too long")
    .trim(),
  role: z
    .string()
    .min(1, "Role is required")
    .max(120, "Role is too long")
    .trim(),
  status: applicationStatusSchema.default("APPLIED"),
  appliedDate: z.coerce.date().optional(),
  notes: z.string().max(5000, "Notes are too long").optional().or(z.literal("")),
});

export const updateApplicationSchema = z
  .object({
    company: z.string().min(1).max(120).trim().optional(),
    role: z.string().min(1).max(120).trim().optional(),
    status: applicationStatusSchema.optional(),
    appliedDate: z.coerce.date().optional(),
    notes: z.string().max(5000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listApplicationsQuerySchema = z.object({
  status: applicationStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;