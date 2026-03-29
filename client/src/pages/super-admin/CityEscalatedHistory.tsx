import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CalendarDays, ImageIcon, Loader2, MapPin, ThumbsDown, ThumbsUp } from "lucide-react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IssueDateRangeFilter } from "@/modules/city-admin/components/IssueDateRangeFilter";
import { getCityIssueDetails } from "@/modules/super-admin/api/super-admin.api";
import type { CityIssueDetail } from "@/modules/super-admin/types/super-admin.types";
import { statusToBadgeVariant, statusToLabel } from "@/modules/citizen/utils/issue-ui";
import { getCategoryLabel, getDistrictLabel, ISSUE_CATEGORIES } from "@/modules/citizen/constants/issue.constants";
import { useI18n } from "@/modules/i18n/useI18n";
import type { DateRange } from "react-day-picker";
import "leaflet/dist/leaflet.css";

const CityEscalatedHistoryPage = () => {
  const navigate = useNavigate();
  const { district = "" } = useParams();
  const { t } = useI18n();
  const [details, setDetails] = useState<CityIssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "unverified" | "unresolved">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  type IssueRecord = CityIssueDetail["issues"][number] & {
    photos?: string[];
    statusLogs?: Array<{
      status: "pending" | "verified" | "in_progress" | "resolved" | "rejected";
      description: string;
      createdAt: string;
    }>;
    upVotes?: number;
    downVotes?: number;
    latestOptionalNote?: string;
  };

  const refreshDetails = useCallback(async () => {
    if (!district) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getCityIssueDetails(district);
      setDetails(response);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || t("errorLoadDistrictIssueDetails"));
      } else {
        toast.error(t("errorLoadDistrictIssueDetails"));
      }
    } finally {
      setLoading(false);
    }
  }, [district, t]);

  useEffect(() => {
    void refreshDetails();
  }, [refreshDetails]);

  const escalatedIssues = useMemo<IssueRecord[]>(() => {
    return ((details?.issues || []) as IssueRecord[])
      .filter((issue) => issue.assignedTo === "super_admin")
      .filter((issue) => Boolean(issue.latestOptionalNote?.trim()));
  }, [details?.issues]);

  const filteredIssues = useMemo(() => {
    let list = [...escalatedIssues];

    if (statusFilter === "unverified") {
      list = list.filter((issue) => issue.status === "pending");
    } else if (statusFilter === "unresolved") {
      list = list.filter((issue) => ["verified", "in_progress"].includes(issue.status));
    }

    if (categoryFilter !== "all") {
      list = list.filter((issue) => issue.category === categoryFilter);
    }

    if (dateRange?.from) {
      const start = dateRange.from.getTime();
      list = list.filter((issue) => new Date(issue.createdAt).getTime() >= start);
    }
    if (dateRange?.to) {
      const end = dateRange.to.getTime();
      list = list.filter((issue) => new Date(issue.createdAt).getTime() <= end);
    }

    return list.sort((a, b) => {
      const aTime = a.escalatedAt ? new Date(a.escalatedAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.escalatedAt ? new Date(b.escalatedAt).getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [categoryFilter, dateRange, escalatedIssues, statusFilter]);

  const selectedIssue = useMemo(() => {
    if (!selectedIssueId) return null;
    return filteredIssues.find((issue) => issue._id === selectedIssueId) || null;
  }, [filteredIssues, selectedIssueId]);
  const hasLocation =
    typeof selectedIssue?.location?.lat === "number" &&
    typeof selectedIssue?.location?.lng === "number";
  const mapCenter = useMemo<[number, number]>(() => {
    if (!hasLocation || !selectedIssue?.location) return [11.0168, 76.9558];
    return [selectedIssue.location.lat, selectedIssue.location.lng];
  }, [hasLocation, selectedIssue?.location]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-foreground/80 motion-safe:animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  if (!details) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("districtDetailsNotFound")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/super-admin/cities/${encodeURIComponent(details.district)}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToIssueDetails")}
        </Button>
        <h1 className="text-2xl font-bold md:text-3xl">
          {t("escalatedHistoryTitle", { district: getDistrictLabel(details.district, t) })}
        </h1>
        <p className="text-sm text-muted-foreground">{t("escalatedHistorySubtitle")}</p>
      </div>

      <Card className="border bg-muted/30">
        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "unverified" | "unresolved")}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={t("filterEscalatedIssues")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allEscalatedIssues")}</SelectItem>
                <SelectItem value="unverified">{t("unverifiedOnly")}</SelectItem>
                <SelectItem value="unresolved">{t("unresolvedOnly")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={t("filterByCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                {ISSUE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <IssueDateRangeFilter value={dateRange} onChange={setDateRange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t("escalatedHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noEscalatedIssues")}</p>
          ) : (
            filteredIssues.map((issue) => (
              <Card
                key={issue._id}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-xl border bg-card shadow-sm transition hover:shadow-md"
                aria-label={t("openEscalatedIssueDetailsAria", { title: issue.title })}
                onClick={() => setSelectedIssueId(issue._id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedIssueId(issue._id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start">
                    <div className="relative h-36 w-full overflow-hidden rounded-xl bg-muted/60 md:h-auto md:w-auto md:max-w-[200px] md:min-w-28 md:shrink-0">
                      {issue.photos?.[0] ? (
                        <img
                          src={issue.photos[0]}
                          alt={issue.title}
                          className="h-full w-full rounded-xl object-cover md:max-h-28 md:object-contain"
                        />
                      ) : (
                        <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="line-clamp-1 text-xl font-semibold">{issue.title}</h3>
                        <Badge variant={statusToBadgeVariant(issue.status)} className="rounded-md px-2.5 py-1 text-xs">
                          {statusToLabel(issue.status, t)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {issue.category ? (
                          <Badge variant="outline" className="rounded-md px-2.5 py-1 text-xs">
                            {getCategoryLabel(issue.category, t)}
                          </Badge>
                        ) : null}
                        {issue.status === "pending" ? (
                          <Badge variant="secondary" className="rounded-md px-2.5 py-1 text-xs">
                            {t("unverified")}
                          </Badge>
                        ) : null}
                        {["verified", "in_progress"].includes(issue.status) ? (
                          <Badge variant="outline" className="rounded-md px-2.5 py-1 text-xs">
                            {t("unresolved")}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {t("reportedAt")}: {new Date(issue.createdAt).toLocaleString()}
                        </span>
                        {issue.escalatedAt ? (
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {t("escalatedAt")}: {new Date(issue.escalatedAt).toLocaleString()}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t pt-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                            <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                            {issue.upVotes ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                            <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                            {issue.downVotes ?? 0}
                          </span>
                        </div>
                        <Button
                          className="rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedIssueId(issue._id);
                          }}
                        >
                          {t("viewFullDetails")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedIssue)}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueId(null);
        }}
      >
        <DialogContent className="h-[calc(100svh-40px)] w-[calc(100%-20px)] max-h-[calc(100svh-40px)] max-w-none overflow-hidden p-0 scrollbar-hide rounded-xl sm:max-w-none md:h-[calc(100svh-20px)] md:max-h-[calc(100svh-20px)] md:w-[60vw]">
          {selectedIssue ? (
            <>
              <DialogHeader className="border-b bg-background px-5 py-3">
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {selectedIssue.title}
                  <Badge variant={statusToBadgeVariant(selectedIssue.status)} className="rounded-md px-2 py-1 text-xs">
                    {statusToLabel(selectedIssue.status, t)}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                  {selectedIssue.category ? (
                    <Badge variant="outline" className="rounded-md px-2 py-1 text-xs">
                      {getCategoryLabel(selectedIssue.category, t)}
                    </Badge>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {selectedIssue.upVotes ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-rose-700 dark:text-rose-300">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    {selectedIssue.downVotes ?? 0}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-lg border p-3">
                  <h3 className="mb-2 font-semibold">{t("reportedDateTime")}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(selectedIssue.createdAt).toLocaleString()}
                    </span>
                    {selectedIssue.escalatedAt ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {new Date(selectedIssue.escalatedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                {selectedIssue.reportedBy ? (
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 font-semibold">{t("reportedInfo")}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="text-foreground">{selectedIssue.reportedBy.name}</p>
                      <p>{selectedIssue.reportedBy.email}</p>
                      {selectedIssue.reportedBy.phone ? <p>{selectedIssue.reportedBy.phone}</p> : null}
                    </div>
                  </div>
                ) : null}

                {selectedIssue.description ? (
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-1 font-semibold">{t("description")}</h3>
                    <p className="text-sm leading-relaxed">{selectedIssue.description}</p>
                  </div>
                ) : null}

                <div className="rounded-lg border p-3">
                  <h3 className="mb-2 font-semibold">{t("escalationDetails")}</h3>
                  {selectedIssue.escalationReason ? (
                    <p className="text-sm">
                      <span className="font-medium">{t("reason")}:</span> {selectedIssue.escalationReason}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noEscalationReason")}</p>
                  )}
                  {selectedIssue.latestOptionalNote ? (
                    <p className="mt-2 text-sm">
                      <span className="font-medium">{t("delayReason")}:</span> {selectedIssue.latestOptionalNote}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{t("noDelayReason")}</p>
                  )}
                  {selectedIssue.escalatedAt ? (
                    <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {new Date(selectedIssue.escalatedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <div className="relative z-0 h-60 overflow-hidden rounded-lg border md:h-80">
                    {hasLocation ? (
                      <MapContainer center={mapCenter} zoom={14} className="h-full w-full">
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <CircleMarker
                          center={mapCenter}
                          radius={10}
                          pathOptions={{
                            color: "#0f766e",
                            fillColor: "#0f766e",
                            fillOpacity: 0.8,
                          }}
                        />
                      </MapContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        {t("locationUnavailable")}
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground inline-flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4" />
                    {selectedIssue.address || t("locationUnavailable")}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <h3 className="mb-2 font-semibold">{t("reportedEvidence")}</h3>
                  {(selectedIssue.photos || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noEvidence")}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                      {(selectedIssue.photos || []).map((photo, index) => (
                        <a
                          key={`${photo}-${index}`}
                          href={photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-border/50">
                            <img
                              src={photo}
                              alt={`${t("reportedEvidenceAlt")} ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {(selectedIssue.resolvedEvidencePhotos || []).length > 0 ? (
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 font-semibold">{t("resolvedEvidence")}</h3>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                      {(selectedIssue.resolvedEvidencePhotos || []).map((photo, index) => (
                        <a
                          key={`${photo}-${index}`}
                          href={photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full"
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-border/50">
                            <img
                              src={photo}
                              alt={`${t("resolvedEvidenceAlt")} ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedIssue.statusLogs && selectedIssue.statusLogs.length > 0 ? (
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 font-semibold">{t("statusLogs")}</h3>
                    <div className="space-y-2">
                      {selectedIssue.statusLogs.map((log, index) => (
                        <div key={`${log.createdAt}-${index}`} className="rounded-md border p-2.5">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant={statusToBadgeVariant(log.status)} className="rounded-[5px]">
                              {statusToLabel(log.status, t)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CityEscalatedHistoryPage;
