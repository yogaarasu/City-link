import { api } from "@/lib/axios";
import type {
  CityAdminIssue,
  CityAdminIssueFilters,
  CityAdminIssueStats,
  CityAdminStatusUpdatePayload,
} from "../types/city-admin-issue.types";

export const getCityAdminDistrictIssues = async (filters: CityAdminIssueFilters) => {
  const response = await api.get<{ issues: CityAdminIssue[] }>("/issues/city-admin/district", {
    params: filters,
  });
  return response.data.issues;
};

export const getCityAdminIssueStats = async () => {
  const response = await api.get<{ stats: CityAdminIssueStats }>("/issues/city-admin/stats");
  return response.data.stats;
};

export const updateCityAdminIssueStatus = async (
  issueId: string,
  payload: CityAdminStatusUpdatePayload
) => {
  const response = await api.patch<{ message: string; issue: CityAdminIssue }>(
    `/issues/${issueId}/status`,
    payload
  );
  return response.data;
};

