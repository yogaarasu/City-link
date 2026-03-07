import { ISSUE_CATEGORIES } from "@/modules/citizen/constants/issue.constants";

export const CITY_ADMIN_STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
] as const;

export const CITY_ADMIN_STATUSES = [
  "pending",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
] as const;

export const CITY_ADMIN_REJECTION_REASONS = [
  "Duplicate Issue",
  "Wrong Location",
  "Not a Civic Issue",
  "Spam / Fake Report",
  "Insufficient Information",
  "Other",
] as const;

export const CITY_ADMIN_CATEGORIES = ISSUE_CATEGORIES;

export type CityAdminStatusFilter = (typeof CITY_ADMIN_STATUS_FILTERS)[number]["value"];
export type CityAdminStatus = (typeof CITY_ADMIN_STATUSES)[number];
export type CityAdminRejectionReason = (typeof CITY_ADMIN_REJECTION_REASONS)[number];

