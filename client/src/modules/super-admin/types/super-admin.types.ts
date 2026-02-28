export interface CityIssueOverviewItem {
  district: string;
  issueCount: number;
  districtState: "active" | "inactive";
  statusBreakdown: {
    pending: number;
    in_progress: number;
    resolved: number;
    rejected: number;
  };
}

export interface SystemOverview {
  totalAdmins: number;
  totalDistricts: number;
  totalActiveDistricts: number;
  totalActiveCities: number;
  cityIssueBreakdown: CityIssueOverviewItem[];
}

export interface CityIssueDetail {
  district: string;
  statusBreakdown: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    rejected: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
  }>;
  repeatedIssues: Array<{
    title: string;
    category: string;
    count: number;
    latestReportedAt: string;
  }>;
  cityAdmins: CityAdmin[];
  issues: Array<{
    _id: string;
    title: string;
    category: string;
    description: string;
    district: string;
    status: "pending" | "in_progress" | "resolved" | "rejected";
    address: string;
    createdAt: string;
    reportedBy?: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
    };
  }>;
}

export interface CityAdmin {
  _id: string;
  adminId?: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  role: "city_admin";
  adminAccess: "active" | "inactive";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  activityLogs: Array<{
    action: string;
    message: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface CityAdminPayload {
  name: string;
  email: string;
  phone: string;
  district: string;
  password: string;
}

export interface CityAdminDetailsResponse {
  admin: CityAdmin;
  districtIssueSummary: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    rejected: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
  }>;
  repeatedIssues: Array<{
    title: string;
    category: string;
    count: number;
    latestReportedAt: string;
  }>;
  recentIssues: Array<{
    _id: string;
    title: string;
    category: string;
    description: string;
    status: "pending" | "in_progress" | "resolved" | "rejected";
    createdAt: string;
    reportedBy?: {
      name: string;
      email: string;
    };
  }>;
}
