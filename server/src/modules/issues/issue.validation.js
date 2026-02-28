import { z } from "zod";
import {
  ISSUE_CATEGORIES,
  ISSUE_STATUS,
  TAMIL_NADU_DISTRICTS,
} from "./issue.constants.js";

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
  photos: z.array(z.string()).max(5).optional().default([]),
});

export const listIssueQuerySchema = z.object({
  district: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export const voteIssueSchema = z.object({
  type: z.enum(["up", "down"]),
});

export const isValidIssueStatus = (status) => ISSUE_STATUS.includes(status);
export const isValidCategory = (category) => ISSUE_CATEGORIES.includes(category);
export const isValidDistrict = (district) => TAMIL_NADU_DISTRICTS.includes(district);
