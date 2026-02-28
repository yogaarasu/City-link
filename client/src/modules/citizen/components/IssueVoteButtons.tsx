import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IssueVoteButtonsProps {
  upVotes: number;
  downVotes: number;
  onVote: (type: "up" | "down") => void;
  canVote?: boolean;
  onBlockedVote?: () => void;
  mode?: "compact" | "split";
}

export const IssueVoteButtons = ({
  upVotes,
  downVotes,
  onVote,
  canVote = true,
  onBlockedVote,
  mode = "compact",
}: IssueVoteButtonsProps) => {
  const onClickVote = (type: "up" | "down") => {
    if (!canVote) {
      onBlockedVote?.();
      return;
    }
    onVote(type);
  };

  if (mode === "split") {
    return (
      <div className="grid w-full grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => onClickVote("up")}
          className="h-9 justify-center gap-1.5 whitespace-nowrap rounded-[7px] border-gray-400 bg-muted px-2 text-xs text-foreground hover:bg-muted/80 sm:text-sm"
        >
          <ThumbsUp className="h-4 w-4 shrink-0 text-emerald-600" />
          Up Vote ({upVotes})
        </Button>
        <Button
          variant="outline"
          onClick={() => onClickVote("down")}
          className="h-9 justify-center gap-1.5 whitespace-nowrap rounded-[7px] border-gray-400 bg-muted px-2 text-xs text-foreground hover:bg-muted/80 sm:text-sm"
        >
          <ThumbsDown className="h-4 w-4 shrink-0 text-red-600" />
          Down Vote ({downVotes})
        </Button>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <Button
        size="xs"
        variant="outline"
        className="rounded-[7px] border-gray-400 bg-muted text-foreground hover:bg-muted/80"
        onClick={() => onClickVote("up")}
      >
        <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
        {upVotes}
      </Button>
      <Button
        size="xs"
        variant="outline"
        className="rounded-[7px] border-gray-400 bg-muted text-foreground hover:bg-muted/80"
        onClick={() => onClickVote("down")}
      >
        <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
        {downVotes}
      </Button>
    </div>
  );
};
