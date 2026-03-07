import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Filter, Layers3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const toVoteNumber = (value: string): number | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.floor(parsed);
};

const CityAdminManageIssues = () => {
  const user = useUserState((state) => state.user);
  const { t } = useI18n();
  const [issues, setIssues] = useState<CityAdminIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CityAdminStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [minVotes, setMinVotes] = useState("");
  const [maxVotes, setMaxVotes] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<CityAdminIssue | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadIssues = async () => {
    const parsedMinVotes = toVoteNumber(minVotes);
    const parsedMaxVotes = toVoteNumber(maxVotes);

    if (
      typeof parsedMinVotes === "number" &&
      typeof parsedMaxVotes === "number" &&
      parsedMinVotes > parsedMaxVotes
    ) {
      toast.error("Min votes cannot be greater than max votes.");
      return;
    }

    try {
      setLoading(true);
      const response = await getCityAdminDistrictIssues({
        status: statusFilter,
        category: categoryFilter,
        minVotes: parsedMinVotes,
        maxVotes: parsedMaxVotes,
      });
      setIssues(response);
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
  }, [statusFilter, categoryFilter, minVotes, maxVotes]);

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
              <Skeleton className="h-11 w-full rounded-lg lg:w-80" />
            </div>
          ) : (
            <>
              <div className="min-w-0 rounded-lg border bg-background/80 p-1.5 lg:h-12 lg:flex-1">
                <div className="flex h-full items-center gap-1 overflow-x-auto whitespace-nowrap pb-0.5 lg:overflow-visible">
                  {CITY_ADMIN_STATUS_FILTERS.map((item) => (
                    <Button
                      key={item.value}
                      size="sm"
                      variant={statusFilter === item.value ? "default" : "outline"}
                      className={
                        statusFilter === item.value
                          ? "h-8 shrink-0 rounded-md px-3 text-xs leading-tight bg-emerald-500 text-white hover:bg-emerald-600 lg:h-9 lg:min-w-0 lg:flex-1 lg:px-2"
                          : "h-8 shrink-0 rounded-md border-transparent bg-transparent px-3 text-xs leading-tight lg:h-9 lg:min-w-0 lg:flex-1 lg:px-2"
                      }
                      onClick={() => setStatusFilter(item.value)}
                    >
                      {item.value === "all" ? t("all") : item.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex h-12 w-full items-center rounded-lg border bg-background/80 px-1 sm:w-auto sm:max-w-full sm:shrink-0">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 w-full min-w-52.5 border-0 bg-transparent pl-2 pr-2 text-base focus-visible:ring-0">
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

              <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border bg-background/80 p-2 lg:h-12 lg:w-auto lg:flex-nowrap">
                <Input
                  type="number"
                  min={0}
                  placeholder="Min votes"
                  value={minVotes}
                  onChange={(event) => setMinVotes(event.target.value)}
                  className="h-8 w-30"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Max votes"
                  value={maxVotes}
                  onChange={(event) => setMaxVotes(event.target.value)}
                  className="h-8 w-30"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
        <Layers3 className="h-4 w-4" />
        {t("showingIssues", { count: sortedIssues.length })}
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
