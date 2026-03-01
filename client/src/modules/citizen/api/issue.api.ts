import { api } from "@/lib/axios";
import type { IIssue, IssueStats } from "../types/issue.types";

export interface CreateIssuePayload {
  title: string;
  category: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  district: string;
  photos: string[];
}

export interface CommunityIssueFilters {
  district?: string;
  category?: string;
  status?: string;
}

export const createIssue = async (payload: CreateIssuePayload) => {
  const response = await api.post<{ message: string; issue: IIssue }>("/issues", payload);
  return response.data;
};

export const getCommunityIssues = async (filters: CommunityIssueFilters) => {
  const response = await api.get<{ issues: IIssue[] }>("/issues/community", {
    params: filters,
  });
  return response.data.issues;
};

export const getMyIssues = async () => {
  const response = await api.get<{ issues: IIssue[] }>("/issues/mine");
  return response.data.issues;
};

export const getMyIssueStats = async () => {
  const response = await api.get<{ stats: IssueStats }>("/issues/mine/stats");
  return response.data.stats;
};

export const getIssueById = async (issueId: string) => {
  const response = await api.get<{ issue: IIssue }>(`/issues/${issueId}`);
  return response.data.issue;
};

export const voteIssue = async (issueId: string, type: "up" | "down") => {
  const response = await api.post<{ message: string; issue: IIssue }>(`/issues/${issueId}/vote`, {
    type,
  });
  return response.data.issue;
};

export const reviewIssue = async (issueId: string, payload: { rating: number; comment?: string }) => {
  const response = await api.patch<{ message: string; issue: IIssue }>(`/issues/${issueId}/review`, payload);
  return response.data;
};

