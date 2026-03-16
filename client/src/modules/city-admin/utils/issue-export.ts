import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { CityAdminIssue } from "../types/city-admin-issue.types";
import { statusToLabel } from "@/modules/citizen/utils/issue-ui";

interface IssueExportOptions {
  district?: string | null;
  startDate?: string;
  endDate?: string;
}

const toDisplayDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const buildStatusLogText = (issue: CityAdminIssue) => {
  if (!issue.statusLogs || issue.statusLogs.length === 0) return "";
  return issue.statusLogs
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((log) => `${toDisplayDate(log.createdAt)} - ${statusToLabel(log.status)}: ${log.description}`)
    .join("\n");
};

const getStatusTimeline = (issue: CityAdminIssue) => {
  const timeline = {
    pending: "",
    verified: "",
    in_progress: "",
    resolved: "",
    rejected: "",
  };

  if (!issue.statusLogs || issue.statusLogs.length === 0) return timeline;

  const ordered = issue.statusLogs
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const log of ordered) {
    if (!timeline[log.status]) {
      timeline[log.status] = toDisplayDate(log.createdAt);
    }
  }

  return timeline;
};

const getFileName = (options?: IssueExportOptions) => {
  const now = format(new Date(), "yyyy-MM-dd_HH-mm");
  const district = options?.district ? options.district.replace(/\s+/g, "-") : "all-districts";
  if (options?.startDate || options?.endDate) {
    const start = options?.startDate ? format(new Date(options.startDate), "yyyy-MM-dd") : "start";
    const end = options?.endDate ? format(new Date(options.endDate), "yyyy-MM-dd") : "end";
    return `city-issues_${district}_${start}_to_${end}_${now}.xlsx`;
  }
  return `city-issues_${district}_${now}.xlsx`;
};

export const exportCityAdminIssuesToExcel = (
  issues: CityAdminIssue[],
  options?: IssueExportOptions
) => {
  const rows = issues.map((issue, index) => {
    const timeline = getStatusTimeline(issue);
    return {
      "S.No": index + 1,
      "Issue ID": issue._id,
      Title: issue.title,
      Category: issue.category,
      Status: statusToLabel(issue.status),
      "Pending At": timeline.pending,
      "Verified At": timeline.verified,
      "In Progress At": timeline.in_progress,
      "Resolved At": timeline.resolved,
      "Rejected At": timeline.rejected,
      "Assigned To": issue.assignedTo === "super_admin" ? "Super Admin" : "City Admin",
      "Escalated?": issue.assignedTo === "super_admin" ? "Yes" : "No",
      "Escalation Reason": issue.escalationReason || "",
      "Escalated At": toDisplayDate(issue.escalatedAt),
      "Reported At": toDisplayDate(issue.createdAt),
      "Last Updated": toDisplayDate(issue.updatedAt),
      District: issue.district,
      Address: issue.address,
      Latitude: issue.location?.lat ?? "",
      Longitude: issue.location?.lng ?? "",
      Description: issue.description,
      "Reported By Name": issue.reportedBy?.name || "",
      "Reported By Email": issue.reportedBy?.email || "",
      "Reported By District": issue.reportedBy?.district || "",
      "Up Votes": issue.upVotes ?? 0,
      "Down Votes": issue.downVotes ?? 0,
      "Total Votes": (issue.upVotes ?? 0) + (issue.downVotes ?? 0),
      "Rejection Reason": issue.rejectionReason || "",
      "Reported Evidence Photos": (issue.photos || []).join("\n"),
      "Resolved Evidence Photos": (issue.resolvedEvidencePhotos || []).join("\n"),
      "Review Rating": issue.review?.rating ?? "",
      "Review Comment": issue.review?.comment ?? "",
      "Status Update Logs": buildStatusLogText(issue),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 26 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 12 },
    { wch: 36 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 38 },
    { wch: 12 },
    { wch: 12 },
    { wch: 50 },
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 40 },
    { wch: 40 },
    { wch: 14 },
    { wch: 30 },
    { wch: 50 },
    { wch: 14 },
    { wch: 30 },
    { wch: 60 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Issues");
  XLSX.writeFile(workbook, getFileName(options));
};
