import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, MapPin, Share2, Star, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { IIssue, IssueStatusLog } from "../types/issue.types";
import { statusToBadgeVariant, statusToColor, statusToLabel } from "../utils/issue-ui";
import { formatIssueTime } from "../utils/time";
import { shareIssue } from "../utils/share";
import { IssueVoteButtons } from "./IssueVoteButtons";
import "leaflet/dist/leaflet.css";
import { cleanProfanity } from "@/lib/profanity";
import { Alert } from "@/components/Alert";

interface IssueDetailsModalProps {
  open: boolean;
  issue: IIssue | null;
  onClose: () => void;
  onVote: (issueId: string, type: "up" | "down") => void;
  onReview?: (issueId: string, rating: number, comment: string) => Promise<void>;
  currentUserId?: string;
  canVote?: boolean;
  onBlockedVote?: () => void;
  isFetchingDetails?: boolean;
  onDelete?: (issue: IIssue) => void;
  canDelete?: boolean;
  onBlockedDelete?: () => void;
  isDeleting?: boolean;
}

const getStatusLogs = (issue: IIssue): IssueStatusLog[] => {
  if (issue.statusLogs && issue.statusLogs.length > 0) return issue.statusLogs;
  return [
    {
      status: issue.status,
      description: "Issue reported by citizen.",
      createdAt: issue.createdAt,
    },
  ];
};

export const IssueDetailsModal = ({
  open,
  issue,
  onClose,
  onVote,
  onReview,
  currentUserId,
  canVote = true,
  onBlockedVote,
  isFetchingDetails = false,
  onDelete,
  canDelete = true,
  onBlockedDelete,
  isDeleting = false,
}: IssueDetailsModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const logs = useMemo(() => (issue ? getStatusLogs(issue) : []), [issue]);
  const mapKey = useMemo(
    () => (issue ? `${issue._id}-${issue.location.lat}-${issue.location.lng}` : "issue-map"),
    [issue]
  );

  useEffect(() => {
    if (!issue) return;
    setRating(issue.review?.rating || 0);
    setComment(issue.review?.comment || "");
  }, [issue]);

  if (!open || !issue) return null;
  const canReview = issue.status === "resolved" && issue.reportedBy?._id === currentUserId;

  const submitReview = async () => {
    if (!onReview || !issue) return;
    if (rating < 1 || rating > 5) return;
    try {
      setIsSubmittingReview(true);
      await onReview(issue._id, rating, comment.trim());
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55">
      <div className="bg-background h-[calc(100svh-40px)] w-[calc(100%-20px)] max-h-[calc(100svh-40px)] overflow-y-auto scrollbar-hide rounded-xl border shadow-2xl md:h-[calc(100svh-20px)] md:w-[60vw] md:max-h-[calc(100svh-20px)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b bg-background px-5 py-3">
          <div>
            <h2 className="text-xl font-semibold">{issue.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={statusToBadgeVariant(issue.status)} className="rounded-[5px]">
                {statusToLabel(issue.status)}
              </Badge>
              <Badge variant="outline">{issue.category}</Badge>
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                {issue.upVotes}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                <ThumbsDown className="h-3.5 w-3.5 text-rose-600" />
                {issue.downVotes}
              </span>
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-3">
          {isFetchingDetails ? (
            <div className="text-muted-foreground inline-flex items-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading latest details...
            </div>
          ) : null}

          <div className="rounded-lg border p-3">
            <h3 className="mb-1 font-semibold">Description</h3>
            <p className="text-sm leading-relaxed">{issue.description}</p>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="font-semibold">Reported Date & Time</h3>
            <p className="text-muted-foreground mt-1 inline-flex items-center text-sm">
              <CalendarDays className="mr-1 h-3.5 w-3.5" />
              {new Date(issue.createdAt).toLocaleString()} ({formatIssueTime(issue.createdAt)})
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="mb-2 font-semibold">Issue Status Update Logs</h3>
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={`${log.createdAt}-${index}`} className="rounded-md border p-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={statusToBadgeVariant(log.status)} className="rounded-[5px]">
                      {statusToLabel(log.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()} ({formatIssueTime(log.createdAt)})
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{log.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div className="relative z-0 h-72 overflow-hidden rounded-lg border md:h-96">
              <MapContainer key={mapKey} center={[issue.location.lat, issue.location.lng]} zoom={14} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <CircleMarker
                  center={[issue.location.lat, issue.location.lng]}
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
                onClick={async () => {
                  await shareIssue(issue);
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Report
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="mb-3 font-semibold">Reported Evidence</h3>
            {issue.photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reported evidence images.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {issue.photos.map((photo, index) => (
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
                        alt={`reported-evidence-${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {(issue.resolvedEvidencePhotos || []).length > 0 ? (
            <div className="rounded-lg border p-3">
              <h3 className="mb-3 font-semibold">Resolved Evidence</h3>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {issue.resolvedEvidencePhotos!.map((photo, index) => (
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
                        alt={`resolved-evidence-${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border p-3">
            <h3 className="mb-2 font-semibold">Community Issue Vote</h3>
            <IssueVoteButtons
              mode="split"
              upVotes={issue.upVotes}
              downVotes={issue.downVotes}
              canVote={canVote}
              onBlockedVote={onBlockedVote}
              onVote={(type) => onVote(issue._id, type)}
            />
          </div>

          {(canReview || issue.review?.rating) && (
            <div className="rounded-lg border p-3">
              <h3 className="mb-2 font-semibold">Resolved Issue Review</h3>
              <div className="mb-2 inline-flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const active = index < rating;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => canReview && setRating(index + 1)}
                      className={canReview ? "cursor-pointer" : "cursor-default"}
                    >
                      <Star
                        className={`h-5 w-5 ${active ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                      />
                    </button>
                  );
                })}
              </div>
              {canReview ? (
                <>
                  <Textarea
                    placeholder="Write your feedback about resolution quality..."
                    value={comment}
                    onChange={(event) => setComment(cleanProfanity(event.target.value))}
                    className="mb-2 min-h-20"
                  />
                  <Button onClick={submitReview} disabled={isSubmittingReview || rating === 0}>
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{issue.review?.comment || "No comment provided."}</p>
              )}
            </div>
          )}

          {onDelete ? (
            <div className="rounded-lg border p-3">
              <h3 className="mb-2 font-semibold">Delete Report</h3>
              <p className="text-sm text-muted-foreground">
                Deleting this report will remove it permanently.
              </p>
              <div className="mt-3">
                {canDelete ? (
                  <Alert
                    trigger={
                      <Button
                        variant="outline"
                        className="h-10 rounded-md border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={isDeleting}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Issue
                      </Button>
                    }
                    title="Delete issue report"
                    description="Are you sure you want to delete this report? This action cannot be undone."
                    onContinue={() => issue && onDelete(issue)}
                    loading={isDeleting}
                    variant="destructive"
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="h-10 rounded-md border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-not-allowed opacity-60"
                    aria-disabled
                    disabled={isDeleting}
                    onClick={(event) => {
                      event.stopPropagation();
                      onBlockedDelete?.();
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Issue
                  </Button>
                )}
                <p className="mt-2 text-xs text-amber-700">
                  Note: You can delete a report only while it is still pending. Once it is verified,
                  deletion is not allowed.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

