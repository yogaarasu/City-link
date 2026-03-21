import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { CheckCircle2, Clock3, ShieldAlert, ShieldCheck, Timer, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleLoader } from "@/components/ui/circle-loader";
import { getCityAdminIssueStats } from "@/modules/city-admin/api/city-admin-issues.api";
import type { CityAdminIssueStats } from "@/modules/city-admin/types/city-admin-issue.types";
import { useUserState } from "@/store/user.store";
import { useI18n } from "@/modules/i18n/useI18n";
import { getDistrictLabel } from "@/modules/citizen/constants/issue.constants";

const defaultStats: CityAdminIssueStats = {
  total: 0,
  pending: 0,
  verified: 0,
  in_progress: 0,
  resolved: 0,
  rejected: 0,
};

const CityAdminDashboard = () => {
  const user = useUserState((state) => state.user);
  const { t } = useI18n();
  const [stats, setStats] = useState<CityAdminIssueStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const statsCacheKey = "citylink:city-admin-stats-cache:v1";

  const readStatsCache = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(statsCacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data?: CityAdminIssueStats };
      return parsed?.data || null;
    } catch {
      return null;
    }
  };

  const writeStatsCache = (payload: CityAdminIssueStats) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(statsCacheKey, JSON.stringify({ data: payload, updatedAt: Date.now() }));
    } catch {
      // ignore cache write errors
    }
  };

  const refreshStats = useCallback(async (showLoading: boolean) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const response = await getCityAdminIssueStats();
      setStats(response);
      writeStatsCache(response);
    } catch (error: unknown) {
      if (showLoading) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error || t("loading"));
          return;
        }
        toast.error(t("loading"));
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [t]);

  useEffect(() => {
    const cached = readStatsCache();
    if (cached) {
      setStats(cached);
      setLoading(false);
      void refreshStats(false);
      return;
    }
    void refreshStats(true);
  }, [refreshStats]);

  const cards = [
    {
      key: "total",
      label: t("totalReports"),
      value: stats.total,
      icon: ShieldAlert,
      textClass: "text-[#129141]",
      iconBg: "bg-[#129141]/15",
    },
    {
      key: "pending",
      label: t("pending"),
      value: stats.pending,
      icon: Clock3,
      textClass: "text-red-600",
      iconBg: "bg-red-500/15",
    },
    {
      key: "verified",
      label: t("verified"),
      value: stats.verified ?? 0,
      icon: ShieldCheck,
      textClass: "text-yellow-600",
      iconBg: "bg-yellow-500/15",
    },
    {
      key: "in_progress",
      label: t("inProgress"),
      value: stats.in_progress,
      icon: Timer,
      textClass: "text-blue-600",
      iconBg: "bg-blue-500/15",
    },
    {
      key: "resolved",
      label: t("resolved"),
      value: stats.resolved,
      icon: CheckCircle2,
      textClass: "text-green-600",
      iconBg: "bg-green-500/15",
    },
    {
      key: "rejected",
      label: t("rejected"),
      value: stats.rejected,
      icon: XCircle,
      textClass: "text-slate-600",
      iconBg: "bg-slate-500/15",
    },
  ];
  const showStatsSpinner = isRefreshing;
  const shimmerClass = "h-2 w-8 rounded-full bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 animate-pulse";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl leading-tight font-bold md:text-3xl md:leading-tight">
        {t("dashboardTitle", { district: user?.district ? getDistrictLabel(user.district, t) : t("districtUnknown") })}
          </h1>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.key} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {loading ? (
                    <CircleLoader size={18} className="border-2" />
                  ) : (
                    <span className="text-4xl leading-tight font-bold">{card.value}</span>
                  )}
                  {showStatsSpinner ? <span className={shimmerClass} /> : null}
                </div>
                <div className={`rounded-full p-3 ${card.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.textClass}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CityAdminDashboard;

