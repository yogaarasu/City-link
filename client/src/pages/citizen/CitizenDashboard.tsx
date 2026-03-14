import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Ban, CheckCircle2, Clock3, ShieldCheck, Timer } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteIssue, getIssueById, getMyIssueStats, getMyIssues, voteIssue } from "@/modules/citizen/api/issue.api";
import { useUserState } from "@/store/user.store";
import type { IIssue, IssueStats } from "@/modules/citizen/types/issue.types";
import { IssueCard } from "@/modules/citizen/components/IssueCard";
import { IssueCardSkeletonList } from "@/modules/citizen/components/IssueCardSkeleton";
import { IssueDetailsModal } from "@/modules/citizen/components/IssueDetailsModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const defaultStats: IssueStats = {
  total: 0,
  pending: 0,
  verified: 0,
  in_progress: 0,
  resolved: 0,
  rejected: 0,
};

const DASHBOARD_CACHE_KEY = "citylink:citizen-dashboard-cache";
const MAX_CACHE_BYTES = 2_000_000;
const MAX_CACHE_ISSUES = 40;
const MIN_CACHE_ISSUES = 10;
let isDashboardCacheDisabled = false;

type DashboardCachePayload = {
  stats: IssueStats;
  issues: IIssue[];
  updatedAt: number;
};

const readDashboardCache = (): DashboardCachePayload | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardCachePayload;
    if (!Array.isArray(parsed.issues)) return null;
    if (!parsed.stats) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeDashboardCache = (issues: IIssue[], stats: IssueStats) => {
  if (typeof window === "undefined") return;
  if (isDashboardCacheDisabled) return;

  const isQuotaExceeded = (error: unknown) => {
    if (!(error instanceof DOMException)) return false;
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    );
  };

  const compactIssueForCache = (issue: IIssue): IIssue => ({
    ...issue,
    description:
      issue.description && issue.description.length > 500
        ? `${issue.description.slice(0, 500)}...`
        : issue.description,
    photos: Array.isArray(issue.photos) ? issue.photos.slice(0, 1) : [],
    resolvedEvidencePhotos: issue.resolvedEvidencePhotos?.slice(0, 1),
    statusLogs: undefined,
    review: issue.review
      ? {
          ...issue.review,
          comment:
            issue.review.comment && issue.review.comment.length > 200
              ? `${issue.review.comment.slice(0, 200)}...`
              : issue.review.comment,
        }
      : issue.review,
  });

  const buildPayload = (payloadIssues: IIssue[]): DashboardCachePayload => ({
    stats,
    issues: payloadIssues,
    updatedAt: Date.now(),
  });

  const tryWrite = (payload: DashboardCachePayload) => {
    const serialized = JSON.stringify(payload);
    if (serialized.length > MAX_CACHE_BYTES) return false;
    try {
      window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, serialized);
      return true;
    } catch (error: unknown) {
      if (!isQuotaExceeded(error)) {
        return true;
      }
      return false;
    }
  };

  const trimmedIssues =
    issues.length > MAX_CACHE_ISSUES ? issues.slice(0, MAX_CACHE_ISSUES) : issues;

  if (issues.length <= MAX_CACHE_ISSUES && tryWrite(buildPayload(issues))) return;
  if (tryWrite(buildPayload(trimmedIssues.map(compactIssueForCache)))) return;
  if (tryWrite(buildPayload(issues.slice(0, MIN_CACHE_ISSUES).map(compactIssueForCache)))) return;

  try {
    window.sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
  } catch {
    // ignore cleanup errors
  }
  isDashboardCacheDisabled = true;
};

const CitizenDashboard = () => {
  const cachedPayload = readDashboardCache();
  const hasCachedPayload = Boolean(cachedPayload);
  const queryClient = useQueryClient();
  const user = useUserState((state) => state.user);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);
  const statsQuery = useQuery({
    queryKey: ["citizen", "stats"],
    queryFn: getMyIssueStats,
    initialData: cachedPayload?.stats,
    initialDataUpdatedAt: cachedPayload?.updatedAt,
  });

  const issuesQuery = useQuery({
    queryKey: ["citizen", "issues"],
    queryFn: getMyIssues,
    initialData: cachedPayload?.issues,
    initialDataUpdatedAt: cachedPayload?.updatedAt,
  });

  const stats = statsQuery.data ?? defaultStats;
  const issues = issuesQuery.data ?? [];
  const isLoading = !hasCachedPayload && (statsQuery.isLoading || issuesQuery.isLoading);
  const showStatsSpinner = statsQuery.isFetching && hasCachedPayload;
  const shimmerClass = "h-2 w-8 rounded-full bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 animate-pulse";

  useEffect(() => {
    if (!issuesQuery.data || !statsQuery.data) return;
    writeDashboardCache(issuesQuery.data, statsQuery.data);
  }, [issuesQuery.data, statsQuery.data]);

  useEffect(() => {
    setVisibleCount((prev) => Math.min(Math.max(prev, 5), Math.max(issues.length, 5)));
  }, [issues.length]);

  const handleVote = async (issueId: string, type: "up" | "down") => {
    const targetIssue = issues.find((item) => item._id === issueId);
    if (targetIssue && targetIssue.reportedBy?._id === user?._id) {
      toast.error("You cannot vote your own report.");
      return;
    }

    try {
      const updated = await voteIssue(issueId, type);
      queryClient.setQueryData<IIssue[]>(["citizen", "issues"], (prev = []) =>
        prev.map((item) => (item._id === issueId ? updated : item))
      );
      setSelectedIssue((prev) => (prev?._id === issueId ? updated : prev));
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to vote");
        return;
      }
      toast.error("Failed to vote");
    }
  };

  const handleOpenDetails = async (issue: IIssue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
    setIsFetchingDetails(true);

    try {
      const details = await getIssueById(issue._id);
      queryClient.setQueryData<IIssue[]>(["citizen", "issues"], (prev = []) =>
        prev.map((item) => (item._id === details._id ? { ...item, ...details } : item))
      );
      setSelectedIssue(details);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to load issue details");
        return;
      }
      toast.error("Failed to load issue details");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleDeleteIssue = async (issue: IIssue) => {
    if (issue.status !== "pending") {
      toast.error("Only pending issues can be deleted after verification is started.");
      return;
    }

    setDeletingIssueId(issue._id);
    try {
      await deleteIssue(issue._id);
      queryClient.setQueryData<IIssue[]>(["citizen", "issues"], (prev = []) =>
        prev.filter((item) => item._id !== issue._id)
      );
      queryClient.setQueryData<IssueStats>(["citizen", "stats"], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total: Math.max(0, prev.total - 1),
          pending: Math.max(0, prev.pending - 1),
        };
      });
      setSelectedIssue((prev) => (prev?._id === issue._id ? null : prev));
      if (selectedIssue?._id === issue._id) {
        setIsModalOpen(false);
      }
      toast.success("Issue deleted successfully.");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to delete issue");
        return;
      }
      toast.error("Failed to delete issue");
    } finally {
      setDeletingIssueId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-linear-to-r from-emerald-600 to-teal-600 text-white">
        <CardContent className="space-y-1.5 px-6 py-4 md:px-6 md:py-5">
          <h1 className="text-2xl font-bold md:text-3xl">Welcome, {user?.name ?? "Citizen"} !</h1>
          <p className="text-base text-white/90 md:text-lg">
            Connected to <span className="font-semibold underline">{user?.district}</span>. Report
            local issues and help build a cleaner, safer community together.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 py-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 rounded-full bg-emerald-100 p-1.5 text-emerald-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Reports</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.total}</p>
                {showStatsSpinner ? <span className={shimmerClass} /> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-8 w-8 rounded-full bg-red-100 p-1.5 text-red-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.pending}</p>
                {showStatsSpinner ? <span className={shimmerClass} /> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 rounded-full bg-yellow-100 p-1.5 text-yellow-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Verified</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.verified ?? 0}</p>
                {showStatsSpinner ? <span className={shimmerClass} /> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Timer className="h-8 w-8 rounded-full bg-blue-100 p-1.5 text-blue-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">In Progress</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.in_progress}</p>
                {showStatsSpinner ? <span className={shimmerClass} /> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 rounded-full bg-emerald-100 p-1.5 text-emerald-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Resolved</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.resolved}</p>
                {showStatsSpinner ? <span className={shimmerClass} /> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Ban className="h-8 w-8 rounded-full bg-slate-100 p-1.5 text-slate-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rejected</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.rejected}</p>
                {showStatsSpinner ? <span className={shimmerClass} /> : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">My Recent Reports</h2>
        </div>
        {isLoading ? (
          <IssueCardSkeletonList count={5} />
        ) : issues.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              You haven&apos;t reported any issues yet.{" "}
              <Link className="font-semibold text-emerald-600 hover:underline" to="/citizen/report-issue">
                Report an issue now
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 scrollbar-hide pr-1">
            {issues.slice(0, visibleCount).map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onVote={handleVote}
                onViewDetails={handleOpenDetails}
                canVote={false}
                onBlockedVote={() => toast.error("You cannot vote your own report.")}
              />
            ))}
            {visibleCount < issues.length ? (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setVisibleCount((prev) => prev + 5)}>
                  Show More
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <IssueDetailsModal
        open={isModalOpen}
        issue={selectedIssue}
        onClose={() => {
          setIsModalOpen(false);
          setIsFetchingDetails(false);
        }}
        onVote={handleVote}
        canVote={false}
        onBlockedVote={() => toast.error("You cannot vote your own report.")}
        isFetchingDetails={isFetchingDetails}
        onDelete={handleDeleteIssue}
        canDelete={selectedIssue?.status === "pending"}
        isDeleting={Boolean(selectedIssue?._id && deletingIssueId === selectedIssue._id)}
        onBlockedDelete={() =>
          toast.error("This report can only be deleted while it is still pending. Once it is verified, deletion is no longer allowed.")
        }
      />
    </div>
  );
};

export default CitizenDashboard;
