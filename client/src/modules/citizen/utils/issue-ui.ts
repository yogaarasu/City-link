import type { IIssue } from "../types/issue.types";

export type IssueBadgeVariant = "warning" | "info" | "success" | "destructive";

export const statusToBadgeVariant = (status: IIssue["status"]): IssueBadgeVariant => {
  if (status === "pending") return "warning";
  if (status === "in_progress") return "info";
  if (status === "resolved") return "success";
  return "destructive";
};

export const statusToLabel = (status: IIssue["status"]) => {
  if (status === "in_progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const statusToColor = (status: IIssue["status"]) => {
  if (status === "pending") return "#f97316";
  if (status === "in_progress") return "#8b5cf6";
  if (status === "resolved") return "#16a34a";
  return "#ef4444";
};
