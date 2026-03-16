import type { CityAdminIssue } from "../types/city-admin-issue.types";

const CITY_ADMIN_ISSUES_CACHE_KEY = "citylink:city-admin-issues-cache:v1";

export interface CityAdminIssuesCacheEntry {
  issues: CityAdminIssue[];
  updatedAt: number;
}

export const buildCityAdminIssuesCacheKey = (
  status: string,
  category: string,
  minVotes: number | undefined,
  maxVotes: number | undefined,
  startDate?: string,
  endDate?: string
) =>
  `${status}__${category}__${minVotes ?? ""}__${maxVotes ?? ""}__${startDate ?? ""}__${endDate ?? ""}`;

export const readCityAdminIssuesCache = (filterKey: string): CityAdminIssuesCacheEntry | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CITY_ADMIN_ISSUES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, CityAdminIssuesCacheEntry>;
    const entry = parsed[filterKey];
    if (!entry || !Array.isArray(entry.issues)) return null;

    return entry;
  } catch {
    return null;
  }
};

export const writeCityAdminIssuesCache = (
  filterKey: string,
  issues: CityAdminIssue[]
) => {
  if (typeof window === "undefined") return;

  const currentRaw = window.sessionStorage.getItem(CITY_ADMIN_ISSUES_CACHE_KEY);
  const current = currentRaw
    ? (JSON.parse(currentRaw) as Record<string, CityAdminIssuesCacheEntry>)
    : {};

  current[filterKey] = {
    issues,
    updatedAt: Date.now(),
  };

  window.sessionStorage.setItem(CITY_ADMIN_ISSUES_CACHE_KEY, JSON.stringify(current));
};
