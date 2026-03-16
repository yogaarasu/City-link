import type { IIssue, IssueStats } from "@/modules/citizen/types/issue.types";
import type {
  CityAdminRejectionReason,
  CityAdminStatus,
} from "../constants/city-admin-issues.constants";

export interface CityAdminIssue extends IIssue {
  resolvedEvidencePhotos?: string[];
  rejectionReason?: CityAdminRejectionReason | null;
}

export interface CityAdminIssueFilters {
  status?: "all" | CityAdminStatus;
  category?: "all" | string;
  minVotes?: number;
  maxVotes?: number;
  startDate?: string;
  endDate?: string;
}

export interface CityAdminStatusUpdatePayload {
  status: CityAdminStatus;
  description?: string;
  resolvedEvidencePhotos?: string[];
  rejectionReason?: CityAdminRejectionReason;
}

export type CityAdminIssueStats = IssueStats;

