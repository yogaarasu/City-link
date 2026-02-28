import { useMemo } from "react";
import { CalendarDays, MapPin, Share2, X } from "lucide-react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IIssue, IssueStatusLog } from "../types/issue.types";
import { statusToBadgeVariant, statusToColor, statusToLabel } from "../utils/issue-ui";
import { formatIssueTime } from "../utils/time";
import { shareIssue } from "../utils/share";
import { IssueVoteButtons } from "./IssueVoteButtons";
import "leaflet/dist/leaflet.css";

interface IssueDetailsModalProps {
  open: boolean;
  issue: IIssue | null;
  onClose: () => void;
  onVote: (issueId: string, type: "up" | "down") => void;
  canVote?: boolean;
  onBlockedVote?: () => void;
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
  canVote = true,
  onBlockedVote,
}: IssueDetailsModalProps) => {
  const logs = useMemo(() => (issue ? getStatusLogs(issue) : []), [issue]);
  const mapKey = useMemo(
    () => (issue ? `${issue._id}-${issue.location.lat}-${issue.location.lng}` : "issue-map"),
    [issue]
  );

  if (!open || !issue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2 md:p-4">
      <div className="bg-background max-h-[95svh] w-full max-w-5xl overflow-y-auto rounded-xl border shadow-2xl px-[5px] py-[5px]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b bg-background px-3 py-2">
          <div>
            <h2 className="text-xl font-semibold">{issue.title}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={statusToBadgeVariant(issue.status)} className="rounded-[5px]">
                {statusToLabel(issue.status)}
              </Badge>
              <Badge variant="outline">{issue.category}</Badge>
            </div>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 px-3 py-3">
          <p className="text-sm leading-relaxed">{issue.description}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="relative z-0 h-64 overflow-hidden rounded-lg border md:h-72">
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

            <div className="space-y-3">
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

              <div className="rounded-lg border p-3">
                <h3 className="mb-2 font-semibold">Evidence Images</h3>
                {issue.photos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evidence images uploaded.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {issue.photos.map((photo, index) => (
                      <img
                        key={`${photo}-${index}`}
                        src={photo}
                        alt={`evidence-${index + 1}`}
                        className="h-20 w-full rounded-md object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
};
