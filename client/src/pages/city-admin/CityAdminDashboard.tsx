import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { CheckCircle2, Clock3, ShieldAlert, Timer, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleLoader } from "@/components/ui/circle-loader";
import { getCityAdminIssueStats } from "@/modules/city-admin/api/city-admin-issues.api";
import type { CityAdminIssueStats } from "@/modules/city-admin/types/city-admin-issue.types";
import { useUserState } from "@/store/user.store";
import { useI18n } from "@/modules/i18n/useI18n";

const defaultStats: CityAdminIssueStats = {
  total: 0,
  pending: 0,
  in_progress: 0,
  resolved: 0,
  rejected: 0,
};

const CityAdminDashboard = () => {
  const user = useUserState((state) => state.user);
  const { t } = useI18n();
  const [stats, setStats] = useState<CityAdminIssueStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const startedAt = Date.now();
      try {
        setLoading(true);
        const response = await getCityAdminIssueStats();
        setStats(response);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error || t("loading"));
          return;
        }
        toast.error(t("loading"));
      } finally {
        const elapsed = Date.now() - startedAt;
        if (elapsed < 1000) {
          await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
        }
        setLoading(false);
      }
    };

    run();
  }, [t]);

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
      textClass: "text-orange-600",
      iconBg: "bg-orange-500/15",
    },
    {
      key: "in_progress",
      label: t("inProgress"),
      value: stats.in_progress,
      icon: Timer,
      textClass: "text-violet-600",
      iconBg: "bg-violet-500/15",
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
      textClass: "text-red-600",
      iconBg: "bg-red-500/15",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl leading-tight font-bold md:text-3xl md:leading-tight">
        {t("dashboardTitle", { district: user?.district || "" })}
          </h1>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.key} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-4xl leading-tight font-bold">
                  {loading ? <CircleLoader size={24} /> : card.value}
                </span>
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

