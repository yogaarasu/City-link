import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { CalendarDays, Camera, ImagePlus, MapPin, Share2, Star, ThumbsDown, ThumbsUp, X } from "lucide-react";
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
import { statusToBadgeVariant, statusToColor, statusToLabel } from "@/modules/citizen/utils/issue-ui";
import { formatIssueTime } from "@/modules/citizen/utils/time";
import { shareIssue } from "@/modules/citizen/utils/share";
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
    "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/60 dark:text-red-300 dark:hover:bg-red-900/30 data-[active=true]:border-red-600 data-[active=true]:bg-red-600 data-[active=true]:text-white dark:data-[active=true]:border-red-500 dark:data-[active=true]:bg-red-500 dark:data-[active=true]:text-white",
  verified:
    "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/60 dark:text-amber-300 dark:hover:bg-amber-900/30 data-[active=true]:border-amber-600 data-[active=true]:bg-amber-600 data-[active=true]:text-white dark:data-[active=true]:border-amber-500 dark:data-[active=true]:bg-amber-500 dark:data-[active=true]:text-white",
  in_progress:
    "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-500/60 dark:text-blue-300 dark:hover:bg-blue-900/30 data-[active=true]:border-blue-600 data-[active=true]:bg-blue-600 data-[active=true]:text-white dark:data-[active=true]:border-blue-500 dark:data-[active=true]:bg-blue-500 dark:data-[active=true]:text-white",
  resolved:
    "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-500/60 dark:text-green-300 dark:hover:bg-green-900/30 data-[active=true]:border-green-600 data-[active=true]:bg-green-600 data-[active=true]:text-white dark:data-[active=true]:border-green-500 dark:data-[active=true]:bg-green-500 dark:data-[active=true]:text-white",
  rejected:
    "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-500/60 dark:text-slate-300 dark:hover:bg-slate-900/30 data-[active=true]:border-slate-600 data-[active=true]:bg-slate-600 data-[active=true]:text-white dark:data-[active=true]:border-slate-500 dark:data-[active=true]:bg-slate-500 dark:data-[active=true]:text-white",
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
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

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
  const isStatusLocked = issue?.status === "resolved" || issue?.status === "rejected";
  const updatableStatuses = useMemo(
    () => CITY_ADMIN_STATUSES.filter((status) => status !== "pending"),
    []
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
    if (selectedStatus === issue.status) {
      toast.error("Cannot update to the same status.");
      return;
    }
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
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
              <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
              {issue.upVotes}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
              <ThumbsDown className="h-3.5 w-3.5 text-rose-600" />
              {issue.downVotes}
            </span>
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

          <div className="space-y-3 rounded-lg border p-3">
            <div className="relative z-0 h-72 overflow-hidden rounded-lg border md:h-96">
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground inline-flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4" />
                {issue.address}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await shareIssue(issue);
                }}
              >
                <Share2 className="h-4 w-4" />
                Share Report
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="mb-2 text-sm font-semibold">Reported Evidence</h3>
            {(issue.photos || []).length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noEvidence")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(issue.photos || []).map((photo, index) => (
                  <a key={`${photo}-${index}`} href={photo} target="_blank" rel="noopener noreferrer">
                    <img
                      src={photo}
                      alt={`Reported evidence ${index + 1}`}
                      className="h-44 w-full rounded-md object-cover sm:h-52"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {(issue.resolvedEvidencePhotos || []).length > 0 ? (
            <div className="rounded-lg border p-3">
              <h3 className="mb-2 text-sm font-semibold">Resolved Evidence</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(issue.resolvedEvidencePhotos || []).map((photo, index) => (
                  <a key={`${photo}-${index}`} href={photo} target="_blank" rel="noopener noreferrer">
                    <img
                      src={photo}
                      alt={`Resolved evidence ${index + 1}`}
                      className="h-44 w-full rounded-md object-cover sm:h-52"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

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
              {updatableStatuses.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  disabled={isStatusLocked}
                  data-active={selectedStatus === status}
                  className={`h-10 rounded-md px-4 text-sm font-medium ${STATUS_BUTTON_STYLES[status]}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {statusToLabel(status)}
                </Button>
              ))}
            </div>
            {isStatusLocked ? (
              <p className="mb-3 text-sm text-muted-foreground">
                This issue is closed. Resolved or rejected issues cannot be updated further.
              </p>
            ) : null}

            {selectedStatus === "resolved" && !isStatusLocked && (
              <div className="mb-3 space-y-2">
                <Label className="text-sm font-medium">{t("resolvedEvidenceRequired")}</Label>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(event) => onUploadResolvedEvidence(event.target.files)}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={(event) => onUploadResolvedEvidence(event.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-muted-foreground hover:border-emerald-400 flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed"
                  >
                    <ImagePlus className="mb-2 h-6 w-6" />
                    Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-muted-foreground hover:border-emerald-400 flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed"
                  >
                    <Camera className="mb-2 h-6 w-6 text-emerald-600" />
                    Camera
                  </button>
                  {resolvedEvidencePhotos.map((photo, index) => (
                    <div key={`${photo}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                      <img src={photo} alt={`Resolved evidence ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-full bg-red-500 p-0.5 text-white"
                        onClick={() => removeResolvedEvidence(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedStatus === "rejected" && !isStatusLocked && (
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
              <Button
                type="button"
                className="h-10 px-5 text-sm"
                onClick={onSubmitStatusUpdate}
                disabled={isUpdating || isStatusLocked}
              >
                {isUpdating ? t("updating") : t("updateStatusAction")}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

