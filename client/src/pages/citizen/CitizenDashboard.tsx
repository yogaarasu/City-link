import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Ban, CheckCircle2, Clock3, Loader, Timer } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { getIssueById, getMyIssueStats, getMyIssues, voteIssue } from "@/modules/citizen/api/issue.api";
import { useUserState } from "@/store/user.store";
import type { IIssue, IssueStats } from "@/modules/citizen/types/issue.types";
import { IssueCard } from "@/modules/citizen/components/IssueCard";
import { IssueDetailsModal } from "@/modules/citizen/components/IssueDetailsModal";

const defaultStats: IssueStats = {
  total: 0,
  pending: 0,
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

const mergeIssuesPreservingExistingCards = (previous: IIssue[], incoming: IIssue[]) => {
  const previousMap = new Map(previous.map((item) => [item._id, item]));
  return incoming.map((item) => previousMap.get(item._id) || item);
};

const CitizenDashboard = () => {
  const cachedPayload = readDashboardCache();
  const user = useUserState((state) => state.user);
  const [stats, setStats] = useState<IssueStats>(cachedPayload?.stats || defaultStats);
  const [issues, setIssues] = useState<IIssue[]>(cachedPayload?.issues || []);
  const [isLoading, setIsLoading] = useState(!cachedPayload);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchMs, setLastFetchMs] = useState<number | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  useEffect(() => {
    const hasCache = Boolean(cachedPayload);

    const load = async () => {
      const startedAt = performance.now();
      try {
        if (hasCache) setIsRefreshing(true);
        else setIsLoading(true);

        const [statsRes, issuesRes] = await Promise.all([getMyIssueStats(), getMyIssues()]);
        const mergedIssues = hasCache
          ? mergeIssuesPreservingExistingCards(cachedPayload?.issues || [], issuesRes)
          : issuesRes;

        setStats(statsRes);
        setIssues(mergedIssues);
        writeDashboardCache(mergedIssues, statsRes);
        setLastFetchMs(Math.round(performance.now() - startedAt));
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error ?? "Failed to load dashboard");
          return;
        }
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    void load();
  }, []);

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
        <CardContent className="grid grid-cols-2 gap-3 py-4 md:grid-cols-3 xl:grid-cols-5">
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
          <div className="text-xs text-muted-foreground">
            {isRefreshing ? "Refreshing..." : null}
            {lastFetchMs !== null ? ` Fetched in ${lastFetchMs} ms` : null}
          </div>
        </div>
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader className="mr-2 h-5 w-5 animate-spin" />
              Loading reports...
            </CardContent>
          </Card>
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
            {issues.slice(0, 5).map((issue) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                onVote={handleVote}
                onViewDetails={handleOpenDetails}
                canVote={false}
                onBlockedVote={() => toast.error("You cannot vote your own report.")}
              />
            ))}
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
