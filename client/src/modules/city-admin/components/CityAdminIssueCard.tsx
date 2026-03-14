import { CalendarDays, ImageIcon, Share2, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CityAdminIssue } from "../types/city-admin-issue.types";
import { statusToBadgeVariant, statusToLabel } from "@/modules/citizen/utils/issue-ui";
import { formatIssueTime } from "@/modules/citizen/utils/time";
import { shareIssue } from "@/modules/citizen/utils/share";
import { useI18n } from "@/modules/i18n/useI18n";

interface CityAdminIssueCardProps {
  issue: CityAdminIssue;
  onOpen: (issue: CityAdminIssue) => void;
}

export const CityAdminIssueCard = ({ issue, onOpen }: CityAdminIssueCardProps) => {
  const { t } = useI18n();

  return (
    <Card
      className="cursor-pointer rounded-xl border bg-card shadow-sm transition hover:shadow-md"
      role="button"
      tabIndex={0}
      aria-label={`Open issue ${issue.title}`}
      onClick={() => onOpen(issue)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(issue);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="relative w-full overflow-hidden rounded-xl bg-muted/60 aspect-[4/3] md:w-60 md:min-w-60 md:max-w-60 md:shrink-0">
            {issue.photos[0] ? (
              <img
                src={issue.photos[0]}
                alt={issue.title}
                className="h-full w-full rounded-xl object-cover object-center"
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            {issue.photos.length > 1 && (
              <span className="absolute right-2 bottom-2 max-w-[calc(100%-16px)] truncate rounded bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white">
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

            <div className="flex items-end justify-between gap-3 border-t pt-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                  {issue.upVotes}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                  {issue.downVotes}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
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
                  className="rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(issue);
                  }}
                >
                  {t("viewFullDetails")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

