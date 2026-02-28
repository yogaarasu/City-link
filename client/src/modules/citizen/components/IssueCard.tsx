import { CalendarDays, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IIssue } from "../types/issue.types";
import { statusToBadgeVariant, statusToLabel } from "../utils/issue-ui";
import { formatIssueTime } from "../utils/time";
import { IssueVoteButtons } from "./IssueVoteButtons";

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
  return (
    <Card
      className="gap-0 cursor-pointer rounded-[8px] py-0"
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
      <CardContent className="relative p-[7px]">
        <div className="absolute top-2 right-2">
          <Badge variant={statusToBadgeVariant(issue.status)} className="rounded-[5px]">
            {statusToLabel(issue.status)}
          </Badge>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 md:gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] md:h-22 md:w-22">
              {issue.photos[0] ? (
                <img
                  src={issue.photos[0]}
                  alt={issue.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              {issue.photos.length > 1 && (
                <span
                  className="absolute bottom-1 right-1 inline-flex h-5 max-w-[calc(100%-6px)] min-w-5 items-center justify-center truncate rounded-[5px] bg-black/80 px-1.5 text-[10px] font-semibold leading-none text-white"
                  title={`+${issue.photos.length - 1}`}
                >
                  +{issue.photos.length - 1}
                </span>
              )}
            </div>

            <div className="space-y-1 text-left">
              <h3 className="line-clamp-2 text-base leading-snug font-semibold md:text-lg">
                {issue.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-[5px] leading-[1.25]">
                  {issue.category}
                </Badge>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs leading-[1.35]">
                <span className="inline-flex items-center">
                  <CalendarDays className="mr-1 h-3.5 w-3.5" />
                  {formatIssueTime(issue.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
            <IssueVoteButtons
              upVotes={issue.upVotes}
              downVotes={issue.downVotes}
              canVote={canVote}
              onBlockedVote={onBlockedVote}
              onVote={(type) => onVote(issue._id, type)}
            />
            </div>
            <Button
              variant="link"
              className="h-auto p-0 text-emerald-600"
              onClick={(event) => {
                event.stopPropagation();
                onViewDetails(issue);
              }}
            >
              View Full Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
