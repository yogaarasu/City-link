import { ISSUE_CATEGORIES } from "@/modules/citizen/constants/issue.constants";
import type { I18nKey } from "@/modules/i18n/config";

export const CITY_ADMIN_STATUS_FILTERS = [
  "all",
  "pending",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
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

export const CITY_ADMIN_REJECTION_REASON_LABEL_KEYS: Record<(typeof CITY_ADMIN_REJECTION_REASONS)[number], I18nKey> = {
  "Duplicate Issue": "rejectionDuplicate",
  "Wrong Location": "rejectionWrongLocation",
  "Not a Civic Issue": "rejectionNotCivic",
  "Spam / Fake Report": "rejectionSpam",
  "Insufficient Information": "rejectionInsufficient",
  Other: "categoryOther",
};

export const CITY_ADMIN_CATEGORIES = ISSUE_CATEGORIES;

export type CityAdminStatusFilter = (typeof CITY_ADMIN_STATUS_FILTERS)[number];
export type CityAdminStatus = (typeof CITY_ADMIN_STATUSES)[number];
export type CityAdminRejectionReason = (typeof CITY_ADMIN_REJECTION_REASONS)[number];

