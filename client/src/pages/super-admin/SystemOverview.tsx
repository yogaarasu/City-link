import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Building2, ChevronRight, MapPinCheck, MapPinned } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSystemOverview } from "@/modules/super-admin/api/super-admin.api";
import type { SystemOverview } from "@/modules/super-admin/types/super-admin.types";
import { TAMIL_NADU_DISTRICTS, getDistrictLabel } from "@/modules/citizen/constants/issue.constants";
import { useI18n } from "@/modules/i18n/useI18n";

const SystemOverviewPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [data, setData] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const overviewCacheKey = "citylink:super-admin-overview-cache:v1";

  const readOverviewCache = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(overviewCacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data?: SystemOverview };
      return parsed?.data || null;
    } catch {
      return null;
    }
  };

  const writeOverviewCache = (payload: SystemOverview) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(overviewCacheKey, JSON.stringify({ data: payload, updatedAt: Date.now() }));
    } catch {
      // ignore cache write errors
    }
  };

  const refreshOverview = useCallback(async (showLoading: boolean) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const response = await getSystemOverview();
      setData(response);
      writeOverviewCache(response);
    } catch (error: unknown) {
      if (showLoading) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error || t("errorLoadSystemOverview"));
        } else {
          toast.error(t("errorLoadSystemOverview"));
        }
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
    const cached = readOverviewCache();
    if (cached) {
      setData(cached);
      setLoading(false);
      void refreshOverview(false);
      return;
    }
    void refreshOverview(true);
  }, [refreshOverview]);

  const sortedCities = useMemo(() => {
    const list = [...(data?.cityIssueBreakdown || [])];
    const filtered = districtFilter === "all" ? list : list.filter((item) => item.district === districtFilter);
    return filtered.sort((a, b) => {
      if (b.statusBreakdown.pending !== a.statusBreakdown.pending) {
        return b.statusBreakdown.pending - a.statusBreakdown.pending;
      }
      return b.issueCount - a.issueCount;
    });
  }, [data?.cityIssueBreakdown, districtFilter]);
  const showStatsSpinner = isRefreshing;
  const shimmerClass = "h-2 w-8 rounded-full bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 animate-pulse";
  const shimmerSmallClass = "h-2 w-6 rounded-full bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 animate-pulse";

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="py-0">
            <CardHeader className="space-y-1 pb-1 pt-2.5">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="pb-2.5">
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardHeader className="space-y-1 pb-1 pt-2.5">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="pb-2.5">
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
          <Card className="py-0">
            <CardHeader className="space-y-1 pb-1 pt-2.5">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="pb-2.5">
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-8 w-full" />
              <div className="hidden sm:block" />
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const halfCount = Math.ceil(sortedCities.length / 2);
  const visibleCities = showAllDistricts ? sortedCities : sortedCities.slice(0, halfCount);

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-bold">{t("systemOverview")}</h1>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="py-0">
          <CardHeader className="space-y-0.5 pb-1 pt-2.5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Building2 className="h-5 w-5" />
              </span>
              {t("totalCityAdmins")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2.5">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{data?.totalAdmins ?? 0}</p>
              {showStatsSpinner ? <span className={shimmerClass} /> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="space-y-0.5 pb-1 pt-2.5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <MapPinned className="h-5 w-5" />
              </span>
              {t("totalDistrictsTamilNadu")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2.5">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{data?.totalDistricts ?? TAMIL_NADU_DISTRICTS.length}</p>
              {showStatsSpinner ? <span className={shimmerClass} /> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="space-y-0.5 pb-1 pt-2.5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <MapPinCheck className="h-5 w-5" />
              </span>
              {t("activeDistricts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2.5">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{data?.totalActiveDistricts ?? 0}</p>
              {showStatsSpinner ? <span className={shimmerClass} /> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("allDistrictIssueStatus")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:text-sm">
                <SelectValue placeholder={t("filterDistrict")} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">{t("allDistricts")}</SelectItem>
                {TAMIL_NADU_DISTRICTS.map((district) => (
                  <SelectItem key={district} value={district}>
                    {getDistrictLabel(district, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="hidden sm:block" />
          </div>

          {!sortedCities.length ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("noDistrictsFound")}
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-12 bg-muted/40 text-center text-sm font-semibold">
                  <div className="col-span-5 min-w-0 border-r px-2 py-2 sm:col-span-7 sm:px-3">{t("districtName")}</div>
                  <div className="col-span-2 border-r px-2 py-2 text-[11px] sm:col-span-2 sm:px-3 sm:text-sm">
                    <span className="block whitespace-pre-line leading-tight sm:hidden">{t("pendingIssuesShort")}</span>
                    <span className="hidden sm:inline">{t("pendingIssues")}</span>
                  </div>
                  <div className="col-span-5 min-w-0 px-2 py-2 sm:col-span-3 sm:px-3">{t("action")}</div>
                </div>
                {visibleCities.map((city, index) => (
                  <div
                    key={city.district}
                    className={`grid grid-cols-12 items-center text-center text-sm ${
                      index !== visibleCities.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="col-span-5 min-w-0 border-r px-2 py-2.5 font-medium sm:col-span-7 sm:px-3">
                      <span className="block truncate text-center" title={city.district}>
                        {getDistrictLabel(city.district, t)}
                      </span>
                    </div>
                    <div className="col-span-2 border-r px-2 py-2.5 font-semibold sm:col-span-2 sm:px-3">
                      <div className="flex items-center justify-center gap-2">
                        <span>{city.statusBreakdown.pending}</span>
                        {showStatsSpinner ? <span className={shimmerSmallClass} /> : null}
                      </div>
                    </div>
                    <div className="col-span-5 min-w-0 px-1 py-2.5 sm:col-span-3 sm:px-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-full min-w-0 gap-1 px-1.5 text-[10px] sm:px-2 sm:text-xs"
                        onClick={() => navigate(`/super-admin/cities/${encodeURIComponent(city.district)}`)}
                      >
                        {t("viewFullDetails")}
                        <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {sortedCities.length > halfCount ? (
                <div className="flex justify-center pt-2">
                  <Button size="sm" variant="outline" onClick={() => setShowAllDistricts((prev) => !prev)}>
                    {showAllDistricts ? t("showLessDistricts") : t("showMoreDistricts")}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemOverviewPage;

