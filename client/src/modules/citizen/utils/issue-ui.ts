import type { IIssue } from "../types/issue.types";

export type IssueBadgeVariant = "warning" | "info" | "success" | "destructive" | "secondary";

export const statusToBadgeVariant = (status: IIssue["status"]): IssueBadgeVariant => {
  if (status === "pending") return "destructive";
  if (status === "verified") return "warning";
  if (status === "in_progress") return "info";
  if (status === "resolved") return "success";
  return "secondary";
};

export const statusToLabel = (status: IIssue["status"]) => {
  if (status === "verified") return "Verified";
  if (status === "in_progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const statusToColor = (status: IIssue["status"]) => {
  if (status === "pending") return "#ef4444";
  if (status === "verified") return "#f59e0b";
  if (status === "in_progress") return "#3b82f6";
  if (status === "resolved") return "#22c55e";
  return "#6b7280";
};

