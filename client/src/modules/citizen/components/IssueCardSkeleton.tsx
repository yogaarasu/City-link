import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface IssueCardSkeletonListProps {
  count?: number;
}

export const IssueCardSkeletonList = ({ count = 3 }: IssueCardSkeletonListProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`issue-skeleton-${index}`} className="rounded-xl border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start">
              <Skeleton className="h-40 w-full rounded-xl md:h-35 md:w-34 md:shrink-0" />
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-between gap-3 border-t pt-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-14 rounded-md" />
                    <Skeleton className="h-8 w-14 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
