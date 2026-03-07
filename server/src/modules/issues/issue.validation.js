import { z } from "zod";
import {
  ISSUE_CATEGORIES,
  ISSUE_REJECTION_REASONS,
  ISSUE_STATUS,
  TAMIL_NADU_DISTRICTS,
} from "./issue.constants.js";

const imageInputSchema = z
  .string()
  .max(4_300_000, "Image payload is too large.")
  .refine(
    (value) =>
      value.startsWith("data:image/") || value.startsWith("https://res.cloudinary.com/"),
    {
      message: "Image must be a base64 data URL or a Cloudinary URL.",
    }
  );

export const createIssueSchema = z.object({
  title: z.string().min(3).max(150),
  category: z.enum(ISSUE_CATEGORIES),
  description: z.string().min(10).max(1000),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  address: z.string().min(5).max(250),
  district: z.enum(TAMIL_NADU_DISTRICTS),
  photos: z.array(imageInputSchema).max(5).optional().default([]),
});

export const listIssueQuerySchema = z.object({
  district: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export const voteIssueSchema = z.object({
  type: z.enum(["up", "down"]),
});

export const updateIssueStatusSchema = z
  .object({
    status: z.enum(ISSUE_STATUS),
    description: z.string().trim().min(3).max(300).optional(),
    resolvedEvidencePhotos: z.array(imageInputSchema).max(5).optional().default([]),
    rejectionReason: z.enum(ISSUE_REJECTION_REASONS).optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.status === "resolved" && payload.resolvedEvidencePhotos.length === 0) {
      ctx.addIssue({
        path: ["resolvedEvidencePhotos"],
        code: z.ZodIssueCode.custom,
        message: "Resolved issues require at least one evidence image.",
      });
    }

    if (payload.status === "rejected" && !payload.rejectionReason) {
      ctx.addIssue({
        path: ["rejectionReason"],
        code: z.ZodIssueCode.custom,
        message: "Rejected issues require a rejection reason.",
      });
    }
  });

export const reviewIssueSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(2).max(400).optional().default(""),
});

export const isValidIssueStatus = (status) => ISSUE_STATUS.includes(status);
export const isValidCategory = (category) => ISSUE_CATEGORIES.includes(category);
export const isValidDistrict = (district) => TAMIL_NADU_DISTRICTS.includes(district);
