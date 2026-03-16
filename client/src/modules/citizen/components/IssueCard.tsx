import { CalendarDays, ImageIcon, Share2, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IIssue } from "../types/issue.types";
import { statusToBadgeVariant, statusToLabel } from "../utils/issue-ui";
import { formatIssueTime } from "../utils/time";
import { shareIssue } from "../utils/share";
import { useI18n } from "@/modules/i18n/useI18n";

interface IssueCardProps {
  issue: IIssue;
  onVote: (issueId: string, type: "up" | "down") => void;
  onViewDetails: (issue: IIssue) => void;
  canVote?: boolean;
  onBlockedVote?: () => void;
}

export const IssueCard = ({
  issue,
  onVote,
  onViewDetails,
  canVote = true,
  onBlockedVote,
}: IssueCardProps) => {
  const { t } = useI18n();

  const onClickVote = (type: "up" | "down") => {
    if (!canVote) {
      onBlockedVote?.();
      return;
    }
    onVote(issue._id, type);
  };

  return (
    <Card
      className="cursor-pointer rounded-xl border bg-card shadow-sm transition hover:shadow-md"
      role="button"
      tabIndex={0}
      aria-label={`Open full details for ${issue.title}`}
      onClick={() => onViewDetails(issue)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onViewDetails(issue);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="relative w-full overflow-hidden rounded-xl bg-muted/60 aspect-[4/3] md:w-60 md:min-w-60 md:max-w-60 md:shrink-0">
            {issue.photos[0] ? (
              <img
                src={issue.photos[0]}
                alt={issue.title}
                className="h-full w-full rounded-xl object-cover object-center"
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            {issue.photos.length > 1 && (
              <span
                className="absolute right-2 bottom-2 max-w-[calc(100%-16px)] truncate rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white"
                title={`+${issue.photos.length - 1}`}
              >
                +{issue.photos.length - 1}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="line-clamp-1 text-xl font-semibold">{issue.title}</h3>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-md px-2.5 py-1 text-xs">
                  {issue.category}
                </Badge>
                <Badge variant={statusToBadgeVariant(issue.status)} className="rounded-md px-2.5 py-1 text-xs">
                  {statusToLabel(issue.status)}
                </Badge>
              </div>
            </div>

            <p className="text-muted-foreground inline-flex items-center text-sm">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              {new Date(issue.createdAt).toLocaleString()} ({formatIssueTime(issue.createdAt)})
            </p>

            {issue.latestOptionalNote ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Admin note:</span>{" "}
                <span className="line-clamp-2">{issue.latestOptionalNote}</span>
              </div>
            ) : null}

            <div className="flex items-end justify-between gap-3 border-t pt-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClickVote("up");
                  }}
                >
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                  {issue.upVotes}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClickVote("down");
                  }}
                >
                  <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                  {issue.downVotes}
                </button>
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <Star
                    className={`h-3.5 w-3.5 text-amber-500 ${
                      issue.review?.rating ? "fill-amber-400" : ""
                    }`}
                  />
                  {issue.review?.rating ? `${issue.review.rating}/5` : t("noRating")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-md"
                  onClick={(event) => {
                    event.stopPropagation();
                    void shareIssue(issue);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  className="rounded-md  bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewDetails(issue);
                  }}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

