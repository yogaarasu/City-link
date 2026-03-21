import type { I18nTranslator } from "../constants/issue.constants";

export const formatIssueTime = (input: string, t?: I18nTranslator) => {
  const value = new Date(input);
  const now = new Date();
  const diffMs = now.getTime() - value.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (t) {
    if (diffMinutes < 1) return t("timeJustNow");
    if (diffMinutes < 60) return t("timeMinutesAgo", { count: diffMinutes });
    if (diffHours < 24) return t("timeHoursAgo", { count: diffHours });
    if (diffDays < 7) return t("timeDaysAgo", { count: diffDays });
  }

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return value.toLocaleString();
};

