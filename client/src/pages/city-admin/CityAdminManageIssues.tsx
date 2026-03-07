import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Filter, Layers3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CITY_ADMIN_CATEGORIES,
  CITY_ADMIN_STATUS_FILTERS,
  type CityAdminStatusFilter,
} from "@/modules/city-admin/constants/city-admin-issues.constants";
import { getCityAdminDistrictIssues } from "@/modules/city-admin/api/city-admin-issues.api";
import { CityAdminIssueCard } from "@/modules/city-admin/components/CityAdminIssueCard";
import { CityAdminIssueDetailsDialog } from "@/modules/city-admin/components/CityAdminIssueDetailsDialog";
import type { CityAdminIssue } from "@/modules/city-admin/types/city-admin-issue.types";
import { useUserState } from "@/store/user.store";
import { useI18n } from "@/modules/i18n/useI18n";

const CityAdminManageIssues = () => {
  const user = useUserState((state) => state.user);
  const { t } = useI18n();
  const [issues, setIssues] = useState<CityAdminIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CityAdminStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<CityAdminIssue | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastFetchMs, setLastFetchMs] = useState<number | null>(null);

  const loadIssues = async () => {
    const startedAt = performance.now();
    try {
      setLoading(true);
      const response = await getCityAdminDistrictIssues({
        status: statusFilter,
        category: categoryFilter,
      });
      setIssues(response);
      setLastFetchMs(Math.round(performance.now() - startedAt));
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Failed to load district issues.");
        return;
      }
      toast.error(t("loading"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [statusFilter, categoryFilter]);

  const sortedIssues = useMemo(
    () =>
      [...issues].sort((a, b) => {
        if (b.upVotes !== a.upVotes) return b.upVotes - a.upVotes;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [issues]
  );

  const onOpenIssue = (issue: CityAdminIssue) => {
    setSelectedIssue(issue);
    setDialogOpen(true);
  };

  const onUpdatedIssue = (updatedIssue: CityAdminIssue) => {
    setIssues((prev) => prev.map((issue) => (issue._id === updatedIssue._id ? updatedIssue : issue)));
    setSelectedIssue(updatedIssue);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("manageIssuesTitle")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("manageIssuesSubtitle", { district: user?.district || "" })}
          </p>
        </div>
        <Button variant="outline" onClick={loadIssues}>
          {t("refresh")}
        </Button>
      </div>

      <Card className="border bg-muted/30">
        <CardContent className="flex flex-col gap-2 pt-4 lg:flex-row lg:items-center">
          {loading ? (
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
              <Skeleton className="h-11 w-full rounded-lg lg:w-140" />
              <Skeleton className="h-11 w-full rounded-lg lg:w-65" />
            </div>
          ) : (
            <>
              <div className="min-w-0 rounded-lg border bg-background/80 p-1.5 lg:h-12">
                <div className="flex flex-wrap items-center gap-1.5 lg:h-full">
                  {CITY_ADMIN_STATUS_FILTERS.map((item) => (
                    <Button
                      key={item.value}
                      size="sm"
                      variant={statusFilter === item.value ? "default" : "outline"}
                      className={statusFilter === item.value ? " bg-emerald-500 hover:bg-emerald-600 text-white" : "border-transparent bg-transparent"}
                      onClick={() => setStatusFilter(item.value)}
                    >
                      {item.value === "all" ? t("all") : item.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center px-1 w-fit max-w-full shrink-0 rounded-lg border bg-background/80 lg:h-12">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 w-auto min-w-52.5 border-0 bg-transparent pl-2 pr-2 text-base focus-visible:ring-0 lg:h-full">
                    <div className="pointer-events-none inline-flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t("filterByCategory")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {CITY_ADMIN_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
        <Layers3 className="h-4 w-4" />
        {t("showingIssues", { count: sortedIssues.length })}
        {lastFetchMs !== null ? ` · fetched in ${lastFetchMs} ms` : ""}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="space-y-2 p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-28 w-44 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedIssues.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("noIssuesFound")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sortedIssues.map((issue) => (
            <CityAdminIssueCard key={issue._id} issue={issue} onOpen={onOpenIssue} />
          ))}
        </div>
      )}

      <CityAdminIssueDetailsDialog
        open={dialogOpen}
        issue={selectedIssue}
        onOpenChange={setDialogOpen}
        onUpdated={onUpdatedIssue}
      />
    </div>
  );
};

export default CityAdminManageIssues;

