import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Ban, CalendarDays, CheckCircle2, Clock3, ImageIcon, Loader2, ShieldCheck, ThumbsDown, ThumbsUp, Timer } from "lucide-react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
//import { Skeleton } from "@/components/ui/skeleton";
import { getCityIssueDetails } from "@/modules/super-admin/api/super-admin.api";
import type { CityIssueDetail } from "@/modules/super-admin/types/super-admin.types";
import { statusToBadgeVariant, statusToColor, statusToLabel } from "@/modules/citizen/utils/issue-ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/modules/i18n/useI18n";
import { getCategoryLabel, getDistrictLabel } from "@/modules/citizen/constants/issue.constants";

const CityIssueDetailsPage = () => {
  const navigate = useNavigate();
  const { district = "" } = useParams();
  const { t } = useI18n();
  const [details, setDetails] = useState<CityIssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [escalatedFilter, setEscalatedFilter] = useState<"all" | "unverified" | "unresolved">("all");
  const [visibleEscalatedCount, setVisibleEscalatedCount] = useState(10);
  const [selectedEscalatedIssueId, setSelectedEscalatedIssueId] = useState<string | null>(null);

  type EscalatedIssue = NonNullable<CityIssueDetail["escalatedIssues"]>[number];
  type IssueRecord = CityIssueDetail["issues"][number] & {
    photos?: string[];
    resolvedEvidencePhotos?: string[];
    upVotes?: number;
    downVotes?: number;
    latestOptionalNote?: string;
    location?: {
      lat: number;
      lng: number;
    };
    statusLogs?: Array<{
      status: "pending" | "verified" | "in_progress" | "resolved" | "rejected";
      description: string;
      createdAt: string;
    }>;
  };

  const readIssueDetailsCache = (districtKey: string) => {
    if (typeof window === "undefined" || !districtKey) return null;
    try {
      const raw = window.sessionStorage.getItem(`citylink:super-admin-city-details:${districtKey}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data?: CityIssueDetail };
      return parsed?.data || null;
    } catch {
      return null;
    }
  };

  const writeIssueDetailsCache = (districtKey: string, payload: CityIssueDetail) => {
    if (typeof window === "undefined" || !districtKey) return;
    try {
      window.sessionStorage.setItem(
        `citylink:super-admin-city-details:${districtKey}`,
        JSON.stringify({ data: payload, updatedAt: Date.now() })
      );
    } catch {
      // ignore cache write errors
    }
  };

  const escalatedBaseIssues = useMemo(() => {
    return details?.escalatedIssues || [];
  }, [details?.escalatedIssues]);

  const filteredEscalatedIssues = useMemo(() => {
    const list = escalatedBaseIssues;
    if (escalatedFilter === "unverified") {
      return list.filter((issue) => issue.status === "pending");
    }
    if (escalatedFilter === "unresolved") {
      return list.filter((issue) => ["verified", "in_progress"].includes(issue.status));
    }
    return list;
  }, [escalatedBaseIssues, escalatedFilter]);

  const escalatedIssueLookup = useMemo(() => {
    const map = new Map<string, IssueRecord>();
    for (const issue of details?.issues || []) {
      map.set(issue._id, issue as IssueRecord);
    }
    return map;
  }, [details?.issues]);

  const resolvedEscalatedIssues = useMemo(() => {
    const merged = filteredEscalatedIssues.map((issue) => {
      const full = escalatedIssueLookup.get(issue._id);
      return {
        ...full,
        ...issue,
      } as EscalatedIssue & IssueRecord;
    });
    const priority = (status: string) => {
      if (status === "pending") return 0;
      if (status === "verified" || status === "in_progress") return 1;
      return 2;
    };
    const byVotesAndTime = (a: IssueRecord, b: IssueRecord) => {
      const votesDiff = (b.upVotes ?? 0) - (a.upVotes ?? 0);
      if (votesDiff !== 0) return votesDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };
    return merged.sort((a, b) => {
      const pA = priority(a.status);
      const pB = priority(b.status);
      if (pA !== pB) return pA - pB;
      return byVotesAndTime(a, b);
    });
  }, [filteredEscalatedIssues, escalatedIssueLookup]);

  const selectedEscalatedIssue = useMemo(() => {
    if (!selectedEscalatedIssueId) return null;
    return resolvedEscalatedIssues.find((issue) => issue._id === selectedEscalatedIssueId) || null;
  }, [resolvedEscalatedIssues, selectedEscalatedIssueId]);

  const selectedMapKey = useMemo(() => {
    if (!selectedEscalatedIssue?.location) return "escalated-map";
    return `${selectedEscalatedIssue._id}-${selectedEscalatedIssue.location.lat}-${selectedEscalatedIssue.location.lng}`;
  }, [selectedEscalatedIssue]);

  useEffect(() => {
    setVisibleEscalatedCount(10);
  }, [escalatedFilter, escalatedBaseIssues.length]);

  const refreshDetails = useCallback(async (showLoading: boolean) => {
    if (!district) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const response = await getCityIssueDetails(district);
      setDetails(response);
      writeIssueDetailsCache(district, response);
    } catch (error: unknown) {
      if (showLoading) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error || t("errorLoadDistrictIssueDetails"));
        } else {
          toast.error(t("errorLoadDistrictIssueDetails"));
        }
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [district, t]);

  useEffect(() => {
    if (!district) return;
    const cached = readIssueDetailsCache(district);
    if (cached) {
      setDetails(cached);
      setLoading(false);
      void refreshDetails(false);
      return;
    }
    void refreshDetails(true);
  }, [district, refreshDetails]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Button variant="outline" onClick={() => navigate("/super-admin/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
            {t("backToSystemOverview")}
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">
            {t("districtIssueDetailsTitle", { district: getDistrictLabel(details.district, t) })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("districtIssueDetailsSubtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/super-admin/cities/${encodeURIComponent(details.district)}/admins`)}
        >
          {t("adminDetails")}
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 py-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 rounded-full bg-emerald-100 p-1.5 text-emerald-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("totalReports")}</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-8 w-8 rounded-full bg-red-100 p-1.5 text-red-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("pending")}</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.pending}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 rounded-full bg-yellow-100 p-1.5 text-yellow-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("verified")}</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.verified}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Timer className="h-8 w-8 rounded-full bg-blue-100 p-1.5 text-blue-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("inProgress")}</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.in_progress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 rounded-full bg-emerald-100 p-1.5 text-emerald-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("resolved")}</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.resolved}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Ban className="h-8 w-8 rounded-full bg-slate-100 p-1.5 text-slate-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("rejected")}</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.rejected}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("issueCategories")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {details.categoryBreakdown.length ? (
            details.categoryBreakdown.map((item) => (
              <div key={item.category} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span>{getCategoryLabel(item.category, t)}</span>
                <span className="rounded-md border px-2 py-1 text-xs font-medium">{item.count}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("noCategoryRecords")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t("escalatedToSuperAdmin")}</CardTitle>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/super-admin/cities/${encodeURIComponent(details.district)}/escalated-history`
                )
              }
            >
              {t("viewEscalatedHistory")}
            </Button>
            <Select
              value={escalatedFilter}
              onValueChange={(value) => setEscalatedFilter(value as "all" | "unverified" | "unresolved")}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={t("filterEscalatedIssues")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allEscalatedIssues")}</SelectItem>
                <SelectItem value="unverified">{t("unverifiedOnly")}</SelectItem>
                <SelectItem value="unresolved">{t("unresolvedOnly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {resolvedEscalatedIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noEscalatedIssues")}</p>
          ) : (
            <>
              {resolvedEscalatedIssues.slice(0, visibleEscalatedCount).map((issue) => (
                <Card
                  key={issue._id}
                  role="button"
                  tabIndex={0}
                  aria-label={t("openEscalatedIssueDetailsAria", { title: issue.title })}
                  className="cursor-pointer rounded-xl border bg-card shadow-sm transition hover:shadow-md"
                  onClick={() => setSelectedEscalatedIssueId(issue._id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedEscalatedIssueId(issue._id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start">
                      <div className="relative h-40 w-full overflow-hidden rounded-xl bg-muted/60 md:h-auto md:w-auto md:max-w-[220px] md:min-w-32 md:shrink-0">
                        {issue.photos?.[0] ? (
                          <img
                            src={issue.photos[0]}
                            alt={issue.title}
                            className="h-full w-full rounded-xl object-cover md:max-h-32 md:object-contain"
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

                        {issue.escalationReason ? (
                          <p className="text-sm">
                            <span className="font-medium">{t("escalationReason")}:</span> {issue.escalationReason}
                          </p>
                        ) : null}
                        {issue.latestOptionalNote ? (
                          <p className="text-sm">
                            <span className="font-medium">{t("delayReason")}:</span> {issue.latestOptionalNote}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">{t("noDelayReason")}</p>
                        )}

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
                              setSelectedEscalatedIssueId(issue._id);
                            }}
                          >
                            {t("viewFullDetails")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {visibleEscalatedCount < resolvedEscalatedIssues.length ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleEscalatedCount((prev) => prev + 10)}
                  >
                    {t("showMore")}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedEscalatedIssue)}
        onOpenChange={(open) => {
          if (!open) setSelectedEscalatedIssueId(null);
        }}
      >
        <DialogContent className="h-[calc(100svh-40px)] w-[calc(100%-20px)] max-h-[calc(100svh-40px)] max-w-none overflow-hidden p-0 scrollbar-hide rounded-xl sm:max-w-none md:h-[calc(100svh-20px)] md:max-h-[calc(100svh-20px)] md:w-[60vw]">
          {selectedEscalatedIssue ? (
            <>
              <DialogHeader className="border-b bg-background px-5 py-3">
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {selectedEscalatedIssue.title}
                  <Badge variant={statusToBadgeVariant(selectedEscalatedIssue.status)} className="rounded-md px-2 py-1 text-xs">
                    {statusToLabel(selectedEscalatedIssue.status, t)}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
                  {selectedEscalatedIssue.category ? (
                    <Badge variant="outline" className="rounded-md px-2 py-1 text-xs">
                      {getCategoryLabel(selectedEscalatedIssue.category, t)}
                    </Badge>
                  ) : null}
                  {selectedEscalatedIssue.status === "pending" ? (
                    <Badge variant="secondary" className="rounded-md px-2 py-1 text-xs">
                      {t("unverified")}
                    </Badge>
                  ) : null}
                  {["verified", "in_progress"].includes(selectedEscalatedIssue.status) ? (
                    <Badge variant="outline" className="rounded-md px-2 py-1 text-xs">
                      {t("unresolved")}
                    </Badge>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                    {selectedEscalatedIssue.upVotes ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                    <ThumbsDown className="h-3.5 w-3.5 text-rose-600" />
                    {selectedEscalatedIssue.downVotes ?? 0}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {t("autoEscalationRules")}
                </div>
                {selectedEscalatedIssue.photos && selectedEscalatedIssue.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {selectedEscalatedIssue.photos.map((photo, index) => (
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
                            alt={`escalated-issue-${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {t("noEvidenceImages")}
                  </div>
                )}

                {selectedEscalatedIssue.description ? (
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-1 font-semibold">{t("description")}</h3>
                    <p className="text-sm leading-relaxed">{selectedEscalatedIssue.description}</p>
                  </div>
                ) : null}

                {selectedEscalatedIssue.statusLogs && selectedEscalatedIssue.statusLogs.length > 0 ? (
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 font-semibold">{t("statusLogs")}</h3>
                    <div className="space-y-2">
                      {selectedEscalatedIssue.statusLogs.map((log, index) => (
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

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 font-semibold">{t("reportedInfo")}</h3>
                    <p className="text-sm text-muted-foreground">{selectedEscalatedIssue.address}</p>
                    <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(selectedEscalatedIssue.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="mb-2 font-semibold">{t("escalationDetails")}</h3>
                    {selectedEscalatedIssue.escalationReason ? (
                      <p className="text-sm">
                        <span className="font-medium">{t("reason")}:</span> {selectedEscalatedIssue.escalationReason}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("noEscalationReason")}</p>
                    )}
                    {selectedEscalatedIssue.latestOptionalNote ? (
                      <p className="mt-2 text-sm">
                        <span className="font-medium">{t("delayReason")}:</span>{" "}
                        {selectedEscalatedIssue.latestOptionalNote}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">{t("noDelayReason")}</p>
                    )}
                    {selectedEscalatedIssue.escalatedAt ? (
                      <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {new Date(selectedEscalatedIssue.escalatedAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <h3 className="mb-2 font-semibold">{t("location")}</h3>
                  {selectedEscalatedIssue.location ? (
                    <div className="relative z-0 h-72 overflow-hidden rounded-lg border md:h-96">
                      <MapContainer
                        key={selectedMapKey}
                        center={[
                          selectedEscalatedIssue.location.lat,
                          selectedEscalatedIssue.location.lng,
                        ]}
                        zoom={14}
                        className="h-full w-full"
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <CircleMarker
                          center={[
                            selectedEscalatedIssue.location.lat,
                            selectedEscalatedIssue.location.lng,
                          ]}
                          radius={10}
                          pathOptions={{
                            color: statusToColor(selectedEscalatedIssue.status),
                            fillColor: statusToColor(selectedEscalatedIssue.status),
                            fillOpacity: 0.8,
                          }}
                        />
                      </MapContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("locationUnavailable")}</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CityIssueDetailsPage;

