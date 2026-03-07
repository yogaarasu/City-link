import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Ban, CheckCircle2, Clock3, ShieldCheck, Timer } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getIssueById, getMyIssueStats, getMyIssues, voteIssue } from "@/modules/citizen/api/issue.api";
import { useUserState } from "@/store/user.store";
import type { IIssue, IssueStats } from "@/modules/citizen/types/issue.types";
import { IssueCard } from "@/modules/citizen/components/IssueCard";
import { IssueCardSkeletonList } from "@/modules/citizen/components/IssueCardSkeleton";
import { IssueDetailsModal } from "@/modules/citizen/components/IssueDetailsModal";

const defaultStats: IssueStats = {
  total: 0,
  pending: 0,
  verified: 0,
  in_progress: 0,
  resolved: 0,
  rejected: 0,
};

const DASHBOARD_CACHE_KEY = "citylink:citizen-dashboard-cache";

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
  const payload: DashboardCachePayload = {
    stats,
    issues,
    updatedAt: Date.now(),
  };
  window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(payload));
};

const mergeIssuesByLatest = (previous: IIssue[], incoming: IIssue[]) => {
  const previousMap = new Map(previous.map((item) => [item._id, item]));
  return incoming.map((item) => {
    const existing = previousMap.get(item._id);
    if (!existing) return item;
    return {
      ...existing,
      ...item,
    };
  });
};

const CitizenDashboard = () => {
  const [cachedPayload] = useState<DashboardCachePayload | null>(() => readDashboardCache());
  const user = useUserState((state) => state.user);
  const [stats, setStats] = useState<IssueStats>(cachedPayload?.stats || defaultStats);
  const [issues, setIssues] = useState<IIssue[]>(cachedPayload?.issues || []);
  const [isLoading, setIsLoading] = useState(!cachedPayload);
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        if (!cachedPayload) {
          setIsLoading(true);
        }
        const [statsRes, issuesRes] = await Promise.all([getMyIssueStats(), getMyIssues()]);
        if (isCancelled) return;

        const mergedIssues = mergeIssuesByLatest(cachedPayload?.issues || [], issuesRes);
        setStats(statsRes);
        setIssues(mergedIssues);
        writeDashboardCache(mergedIssues, statsRes);
      } catch (error: unknown) {
        if (isCancelled) return;
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error ?? "Failed to load dashboard");
          return;
        }
        toast.error("Failed to load dashboard");
      } finally {
        if (!cachedPayload && !isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      isCancelled = true;
    };
  }, [cachedPayload]);

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
      setIssues((prev) => {
        const next = prev.map((item) => (item._id === issueId ? updated : item));
        writeDashboardCache(next, stats);
        return next;
      });
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
      setIssues((prev) => {
        const next = prev.map((item) => (item._id === details._id ? { ...item, ...details } : item));
        writeDashboardCache(next, stats);
        return next;
      });
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

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-linear-to-r from-emerald-600 to-teal-600 text-white">
        <CardContent className="space-y-1.5 px-6 py-4 md:px-6 md:py-5">
          <h1 className="text-2xl font-bold md:text-3xl">Welcome, {user?.name ?? "Citizen"}!</h1>
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
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-8 w-8 rounded-full bg-orange-100 p-1.5 text-orange-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 rounded-full bg-sky-100 p-1.5 text-sky-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold">{stats.verified ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Timer className="h-8 w-8 rounded-full bg-violet-100 p-1.5 text-violet-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{stats.in_progress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 rounded-full bg-emerald-100 p-1.5 text-emerald-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold">{stats.resolved}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Ban className="h-8 w-8 rounded-full bg-rose-100 p-1.5 text-rose-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
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
      />
    </div>
  );
};

export default CitizenDashboard;
