import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { endOfDay, startOfDay } from "date-fns";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Filter, Layers3, List, Map as MapIcon } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Badge } from "@/components/ui/badge";
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
import { CityAdminIssueExportButton } from "@/modules/city-admin/components/CityAdminIssueExportButton";
import { IssueDateRangeFilter } from "@/modules/city-admin/components/IssueDateRangeFilter";
import type { CityAdminIssue } from "@/modules/city-admin/types/city-admin-issue.types";
import {
  statusToBadgeVariant,
  statusToColor,
  statusToLabel,
} from "@/modules/citizen/utils/issue-ui";
import {
  buildCityAdminIssuesCacheKey,
  readCityAdminIssuesCache,
  writeCityAdminIssuesCache,
} from "@/modules/city-admin/utils/city-admin-issues-cache";
import { useUserState } from "@/store/user.store";
import { useI18n } from "@/modules/i18n/useI18n";
import { formatIssueTime } from "@/modules/citizen/utils/time";
import { getCategoryLabel, getStatusFilterLabel, getDistrictLabel } from "@/modules/citizen/constants/issue.constants";
import "leaflet/dist/leaflet.css";

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
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [statusFilter, setStatusFilter] = useState<CityAdminStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [minVotes, setMinVotes] = useState("");
  const [maxVotes, setMaxVotes] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [initialCache] = useState(() =>
    readCityAdminIssuesCache(
      buildCityAdminIssuesCacheKey("all", "all", undefined, undefined, undefined, undefined)
    )
  );
  const [issues, setIssues] = useState<CityAdminIssue[]>(initialCache?.issues || []);
  const [loading, setLoading] = useState(!initialCache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CityAdminIssue | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const requestIdRef = useRef(0);

  const parsedMinVotes = useMemo(() => toVoteNumber(minVotes), [minVotes]);
  const parsedMaxVotes = useMemo(() => toVoteNumber(maxVotes), [maxVotes]);
  const startDate = useMemo(
    () => (dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined),
    [dateRange?.from]
  );
  const endDate = useMemo(
    () => (dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined),
    [dateRange?.to]
  );
  const filterKey = useMemo(
    () =>
      buildCityAdminIssuesCacheKey(
        statusFilter,
        categoryFilter,
        parsedMinVotes,
        parsedMaxVotes,
        startDate,
        endDate
      ),
    [categoryFilter, parsedMaxVotes, parsedMinVotes, statusFilter, startDate, endDate]
  );

  const fetchIssues = useCallback(async (blocking: boolean) => {
    if (
      typeof parsedMinVotes === "number" &&
      typeof parsedMaxVotes === "number" &&
      parsedMinVotes > parsedMaxVotes
    ) {
      toast.error(t("errorMinVotesGreater"));
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      if (blocking) setLoading(true);
      else setIsRefreshing(true);

      const response = await getCityAdminDistrictIssues({
        status: statusFilter,
        category: categoryFilter,
        minVotes: parsedMinVotes,
        maxVotes: parsedMaxVotes,
        startDate,
        endDate,
      });

      if (requestId !== requestIdRef.current) return;
      setIssues(response);
      writeCityAdminIssuesCache(filterKey, response);
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) return;
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || t("errorLoadDistrictIssues"));
        return;
      }
      toast.error(t("loading"));
    } finally {
      if (requestId === requestIdRef.current) {
        if (blocking) setLoading(false);
        else setIsRefreshing(false);
      }
    }
  }, [categoryFilter, parsedMaxVotes, parsedMinVotes, statusFilter, startDate, endDate, t, filterKey]);

  useEffect(() => {
    const cached = readCityAdminIssuesCache(filterKey);

    if (cached) {
      setIssues(cached.issues);
      setLoading(false);
      void fetchIssues(false);
      return;
    }

    setIssues([]);
    void fetchIssues(true);
  }, [fetchIssues, filterKey]);

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
    setIssues((prev) => {
      const next = prev.map((issue) => (issue._id === updatedIssue._id ? updatedIssue : issue));
      writeCityAdminIssuesCache(filterKey, next);
      return next;
    });
    setSelectedIssue(updatedIssue);
  };

  const hasIssueLocation = useCallback(
    (issue: CityAdminIssue) =>
      typeof issue.location?.lat === "number" && typeof issue.location?.lng === "number",
    []
  );
  const mapCenter = useMemo<[number, number]>(() => {
    const issueWithLocation = sortedIssues.find((issue) => hasIssueLocation(issue));
    if (issueWithLocation) {
      return [issueWithLocation.location.lat, issueWithLocation.location.lng];
    }
    return [11.0168, 76.9558];
  }, [hasIssueLocation, sortedIssues]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("manageIssuesTitle")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("manageIssuesSubtitle", { district: user?.district ? getDistrictLabel(user.district, t) : t("districtUnknown") })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border p-1">
            <Button
              size="sm"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              className="h-8 px-3"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t("listView")}</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "map" ? "secondary" : "ghost"}
              className="h-8 px-3"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t("mapView")}</span>
            </Button>
          </div>

          <CityAdminIssueExportButton
            issues={sortedIssues}
            district={user?.district}
            startDate={startDate}
            endDate={endDate}
            disabled={loading || isRefreshing}
          />
          <Button
            variant="outline"
            onClick={() => void fetchIssues(false)}
            disabled={loading || isRefreshing}
          >
            {isRefreshing ? `${t("refresh")}...` : t("refresh")}
          </Button>
        </div>
      </div>

      <Card className="border bg-muted/30">
        <CardContent className="flex flex-col gap-2 pt-4 lg:flex-row lg:flex-wrap lg:items-center">
          {loading ? (
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
              <Skeleton className="h-11 w-full rounded-lg lg:w-140" />
              <Skeleton className="h-11 w-full rounded-lg lg:w-65" />
              <Skeleton className="h-11 w-full rounded-lg lg:w-80" />
              <Skeleton className="h-11 w-full rounded-lg lg:w-80" />
            </div>
          ) : (
            <>
              <div className="w-full space-y-2">
                <div className="min-w-0 rounded-lg border bg-background/80 p-1.5 lg:h-12">
                  <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:items-center">
                    {CITY_ADMIN_STATUS_FILTERS.map((item) => (
                      <Button
                        key={item}
                        size="sm"
                        variant={statusFilter === item ? "default" : "outline"}
                        className={
                          statusFilter === item
                            ? "min-h-9 w-full rounded-md bg-emerald-500 px-3 py-1.5 text-center text-sm leading-snug whitespace-normal break-words text-white hover:bg-emerald-600 sm:min-w-[6.5rem] sm:flex-1 sm:px-2"
                            : "min-h-9 w-full rounded-md border-transparent bg-transparent px-3 py-1.5 text-center text-sm leading-snug whitespace-normal break-words sm:min-w-[6.5rem] sm:flex-1 sm:px-2"
                        }
                        onClick={() => setStatusFilter(item)}
                      >
                        {getStatusFilterLabel(item, t)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
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
                              {getCategoryLabel(category, t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border bg-background/80 p-2 lg:h-12 lg:w-auto lg:flex-nowrap">
                    <Input
                      type="number"
                      min={0}
                      placeholder={t("minVotes")}
                      value={minVotes}
                      onChange={(event) => setMinVotes(event.target.value)}
                      className="h-8 w-30"
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder={t("maxVotes")}
                      value={maxVotes}
                      onChange={(event) => setMaxVotes(event.target.value)}
                      className="h-8 w-30"
                    />
                  </div>

                  <div className="w-full lg:min-w-96 lg:flex-1">
                    <IssueDateRangeFilter
                      value={dateRange}
                      onChange={setDateRange}
                      disabled={loading || isRefreshing}
                    />
                  </div>
                </div>
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
      ) : viewMode === "map" ? (
        <Card>
          <CardContent className="p-3">
            <div className="relative z-0 h-105 overflow-hidden rounded-xl border md:h-115">
              <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {sortedIssues.filter(hasIssueLocation).map((issue) => (
                  <CircleMarker
                    key={issue._id}
                    center={[issue.location.lat, issue.location.lng]}
                    radius={8}
                    pathOptions={{
                      color: statusToColor(issue.status),
                      fillColor: statusToColor(issue.status),
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <h3 className="font-semibold">{issue.title}</h3>
                        <p className="text-xs">{getCategoryLabel(issue.category, t)}</p>
                        <p className="text-xs text-muted-foreground">{issue.address}</p>
                        <Badge variant={statusToBadgeVariant(issue.status)}>
                          {statusToLabel(issue.status, t)}
                        </Badge>
                        {issue.assignedTo === "super_admin" ? (
                          <Badge variant="secondary">{t("escalated")}</Badge>
                        ) : null}
                        <p className="text-xs text-muted-foreground">{formatIssueTime(issue.createdAt, t)}</p>
                        <Button size="sm" variant="link" className="px-0" onClick={() => onOpenIssue(issue)}>
                          {t("viewDetails")}
                        </Button>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
            {sortedIssues.length === 0 ? (
              <p className="mt-2 text-center text-sm text-muted-foreground">{t("noIssuesFound")}</p>
            ) : null}
          </CardContent>
        </Card>
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
