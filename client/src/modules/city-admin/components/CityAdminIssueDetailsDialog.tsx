import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { CalendarDays, MapPin, Star, Upload, X } from "lucide-react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IssueVoteButtons } from "@/modules/citizen/components/IssueVoteButtons";
import { statusToBadgeVariant, statusToColor, statusToLabel } from "@/modules/citizen/utils/issue-ui";
import { formatIssueTime } from "@/modules/citizen/utils/time";
import {
  CITY_ADMIN_REJECTION_REASONS,
  CITY_ADMIN_STATUSES,
  type CityAdminRejectionReason,
  type CityAdminStatus,
} from "../constants/city-admin-issues.constants";
import { updateCityAdminIssueStatus } from "../api/city-admin-issues.api";
import type { CityAdminIssue } from "../types/city-admin-issue.types";
import { useI18n } from "@/modules/i18n/useI18n";
import "leaflet/dist/leaflet.css";

interface CityAdminIssueDetailsDialogProps {
  open: boolean;
  issue: CityAdminIssue | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updatedIssue: CityAdminIssue) => void;
}

const STATUS_BUTTON_STYLES: Record<CityAdminStatus, string> = {
  pending:
    "border-orange-300 text-orange-700 hover:bg-orange-50 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-800",
  in_progress:
    "border-violet-300 text-violet-700 hover:bg-violet-50 data-[active=true]:bg-violet-100 data-[active=true]:text-violet-800",
  resolved:
    "border-green-300 text-green-700 hover:bg-green-50 data-[active=true]:bg-green-100 data-[active=true]:text-green-800",
  rejected:
    "border-red-300 text-red-700 hover:bg-red-50 data-[active=true]:bg-red-100 data-[active=true]:text-red-800",
};

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

export const CityAdminIssueDetailsDialog = ({
  open,
  issue,
  onOpenChange,
  onUpdated,
}: CityAdminIssueDetailsDialogProps) => {
  const { t } = useI18n();
  const [selectedStatus, setSelectedStatus] = useState<CityAdminStatus>("pending");
  const [description, setDescription] = useState("");
  const [rejectionReason, setRejectionReason] = useState<CityAdminRejectionReason | "">("");
  const [resolvedEvidencePhotos, setResolvedEvidencePhotos] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!issue) return;
    setSelectedStatus(issue.status);
    setDescription("");
    setRejectionReason((issue.rejectionReason as CityAdminRejectionReason) || "");
    setResolvedEvidencePhotos(issue.resolvedEvidencePhotos || []);
  }, [issue]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (!issue) return [11.0168, 76.9558];
    return [issue.location.lat, issue.location.lng];
  }, [issue]);

  const allEvidence = useMemo(
    () => [...(issue?.photos || []), ...(issue?.resolvedEvidencePhotos || [])],
    [issue]
  );

  const onUploadResolvedEvidence = async (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    if (resolvedEvidencePhotos.length + incoming.length > 5) {
      toast.error(t("uploadLimit"));
      return;
    }
    try {
      const encoded = await Promise.all(incoming.map((file) => toBase64(file)));
      setResolvedEvidencePhotos((prev) => [...prev, ...encoded]);
    } catch {
      toast.error(t("imageProcessFailed"));
    }
  };

  const removeResolvedEvidence = (index: number) => {
    setResolvedEvidencePhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onSubmitStatusUpdate = async () => {
    if (!issue) return;
    if (selectedStatus === "resolved" && resolvedEvidencePhotos.length === 0) {
      toast.error(t("resolvedNeedsEvidence"));
      return;
    }
    if (selectedStatus === "rejected" && !rejectionReason) {
      toast.error(t("selectRejectionReasonError"));
      return;
    }

    try {
      setIsUpdating(true);
      const response = await updateCityAdminIssueStatus(issue._id, {
        status: selectedStatus,
        description: description.trim() || undefined,
        resolvedEvidencePhotos: selectedStatus === "resolved" ? resolvedEvidencePhotos : [],
        rejectionReason: selectedStatus === "rejected" ? (rejectionReason || undefined) : undefined,
      });
      toast.success(response.message);
      onUpdated(response.issue);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || t("updateFailed"));
        return;
      }
      toast.error(t("updateFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90svh] w-[94vw] max-h-[90svh] max-w-[94vw] overflow-hidden p-0 md:h-[80svh] md:w-[60vw] md:max-h-[80svh] md:max-w-[60vw]">
        <DialogHeader className="sticky top-0 z-20 border-b bg-background px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="line-clamp-2 text-left text-lg md:text-xl">{issue.title}</DialogTitle>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-md"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={statusToBadgeVariant(issue.status)} className="rounded-md">{statusToLabel(issue.status)}</Badge>
            <Badge variant="outline" className="rounded-md">{issue.category}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-hide max-h-[calc(90svh-76px)] space-y-4 overflow-y-auto px-4 py-4 md:max-h-[calc(80svh-86px)] md:px-6 md:py-5">
          <div className="rounded-lg border p-3">
            <h3 className="mb-1 text-sm font-semibold">{t("reportedDateTime")}</h3>
            <p className="text-muted-foreground inline-flex items-center text-sm">
              <CalendarDays className="mr-1 h-4 w-4" />
              {new Date(issue.createdAt).toLocaleString()} ({formatIssueTime(issue.createdAt)})
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="mb-1 text-sm font-semibold">{t("description")}</h3>
            <p className="text-sm leading-relaxed">{issue.description}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t("mapView")}</h3>
              <div className="relative z-0 h-64 overflow-hidden rounded-lg border">
                <MapContainer center={mapCenter} zoom={14} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <CircleMarker
                    center={mapCenter}
                    radius={10}
                    pathOptions={{
                      color: statusToColor(issue.status),
                      fillColor: statusToColor(issue.status),
                      fillOpacity: 0.8,
                    }}
                  />
                </MapContainer>
              </div>
              <p className="text-muted-foreground inline-flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4" />
                {issue.address}
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <h3 className="mb-2 text-sm font-semibold">{t("statusLogs")}</h3>
                <div className="space-y-2">
                  {(issue.statusLogs || []).slice().reverse().map((log, index) => (
                    <div key={`${log.createdAt}-${index}`} className="rounded-md border p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={statusToBadgeVariant(log.status)} className="rounded-md">
                          {statusToLabel(log.status)}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {log.description ? <p className="mt-1 text-sm text-muted-foreground">{log.description}</p> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <h3 className="mb-2 text-sm font-semibold">{t("evidenceImages")}</h3>
                {allEvidence.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("noEvidence")}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {allEvidence.map((photo, index) => (
                      <img
                        key={`${photo}-${index}`}
                        src={photo}
                        alt={`Issue evidence ${index + 1}`}
                        className="h-28 w-full rounded-md object-cover md:h-32"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {issue.review?.rating ? (
            <div className="rounded-lg border p-3">
              <h3 className="mb-2 text-sm font-semibold">{t("citizenReview")}</h3>
              <div className="inline-flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < issue.review!.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              {issue.review?.comment ? (
                <p className="mt-1 text-sm text-muted-foreground">{issue.review.comment}</p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border p-3">
            <h3 className="mb-2 text-sm font-semibold">{t("updateStatus")}</h3>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {CITY_ADMIN_STATUSES.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  size="sm"
                  data-active={selectedStatus === status}
                  className={STATUS_BUTTON_STYLES[status]}
                  onClick={() => setSelectedStatus(status)}
                >
                  {statusToLabel(status)}
                </Button>
              ))}
            </div>

            {selectedStatus === "resolved" && (
              <div className="mb-3 space-y-2">
                <Label className="text-sm font-medium">{t("resolvedEvidenceRequired")}</Label>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/60">
                    <Upload className="h-4 w-4" />
                    {t("uploadImage")}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(event) => onUploadResolvedEvidence(event.target.files)}
                    />
                  </label>
                  {resolvedEvidencePhotos.map((photo, index) => (
                    <div key={`${photo}-${index}`} className="relative h-16 w-16 overflow-hidden rounded-md border">
                      <img src={photo} alt={`Resolved evidence ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                        onClick={() => removeResolvedEvidence(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedStatus === "rejected" && (
              <div className="mb-3">
                <Label className="mb-1.5 block text-sm font-medium">{t("rejectionReasonRequired")}</Label>
                <Select
                  value={rejectionReason}
                  onValueChange={(value) => setRejectionReason(value as CityAdminRejectionReason)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectRejectionReason")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CITY_ADMIN_REJECTION_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("optionalNote")}</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("optionalNotePlaceholder")}
                className="min-h-20"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" onClick={onSubmitStatusUpdate} disabled={isUpdating}>
                {isUpdating ? t("updating") : t("updateStatusAction")}
              </Button>
            </DialogFooter>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="mb-2 text-sm font-semibold">{t("communityVotes")}</h3>
            <IssueVoteButtons
              mode="split"
              canVote={false}
              upVotes={issue.upVotes}
              downVotes={issue.downVotes}
              onVote={() => undefined}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

