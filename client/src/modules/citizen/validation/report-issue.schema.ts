import * as z from "zod";
import {
  ISSUE_CATEGORIES,
  TAMIL_NADU_DISTRICTS,
} from "../constants/issue.constants";
import { MAX_REPORT_ISSUE_PHOTOS } from "../constants/report-issue-upload.constants";

export const reportIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.enum(ISSUE_CATEGORIES),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  address: z.string().min(5, "Address is required"),
  district: z.enum(TAMIL_NADU_DISTRICTS),
  photos: z.array(z.string()).max(MAX_REPORT_ISSUE_PHOTOS, "Maximum 5 photos allowed"),
});

export type ReportIssueFormValues = z.infer<typeof reportIssueSchema>;

