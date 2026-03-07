import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { Loader, List, Map as MapIcon } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCommunityIssues, getIssueById, voteIssue } from "@/modules/citizen/api/issue.api";
import {
  ISSUE_CATEGORIES,
  ISSUE_STATUS,
  STATUS_LABELS,
  TAMIL_NADU_DISTRICTS,
} from "@/modules/citizen/constants/issue.constants";
import type { IIssue } from "@/modules/citizen/types/issue.types";
import {
  statusToBadgeVariant,
  statusToColor,
  statusToLabel,
} from "@/modules/citizen/utils/issue-ui";
import { formatIssueTime } from "@/modules/citizen/utils/time";
import { IssueCard } from "@/modules/citizen/components/IssueCard";
import { IssueDetailsModal } from "@/modules/citizen/components/IssueDetailsModal";
import { useUserState } from "@/store/user.store";
import "leaflet/dist/leaflet.css";

const CommunityIssues = () => {
  const PAGE_SIZE = 10;
  const user = useUserState((state) => state.user);
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [district, setDistrict] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastFetchMs, setLastFetchMs] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const load = async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      const startedAt = performance.now();

      try {
        setIsLoading(true);
        const response = await getCommunityIssues({
          district,
          category,
          status,
          page: 1,
          limit: PAGE_SIZE,
        });

        if (requestId !== requestIdRef.current) return;

        setIssues(response.issues);
        setPage(response.page);
        setHasMore(response.hasMore);
        setLastFetchMs(Math.round(performance.now() - startedAt));
      } catch (error: unknown) {
        if (requestId !== requestIdRef.current) return;
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error ?? "Failed to load community issues");
          return;
        }
        toast.error("Failed to load community issues");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    load();
  }, [district, category, status]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const startedAt = performance.now();

    try {
      setIsLoadingMore(true);
      const response = await getCommunityIssues({
        district,
        category,
        status,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (requestId !== requestIdRef.current) return;

      setIssues((prev) => {
        const seen = new Set(prev.map((item) => item._id));
        const incoming = response.issues.filter((item) => !seen.has(item._id));
        return [...prev, ...incoming];
      });
      setPage(response.page);
      setHasMore(response.hasMore);
      setLastFetchMs(Math.round(performance.now() - startedAt));
    } catch (error: unknown) {
      if (requestId !== requestIdRef.current) return;
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to load more issues");
        return;
      }
      toast.error("Failed to load more issues");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  };

  const mapCenter = useMemo<[number, number]>(() => {
    if (issues.length > 0) {
      return [issues[0].location.lat, issues[0].location.lng];
    }
    return [11.0168, 76.9558];
  }, [issues]);

  const handleVote = async (issueId: string, type: "up" | "down") => {
    const targetIssue = issues.find((item) => item._id === issueId) || selectedIssue;
    if (targetIssue?.reportedBy?._id === user?._id) {
      toast.error("You cannot vote your own report.");
      return;
    }

    try {
      const updated = await voteIssue(issueId, type);
      setIssues((prev) => prev.map((item) => (item._id === issueId ? updated : item)));
      setSelectedIssue((prev) => (prev?._id === issueId ? updated : prev));
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to vote");
        return;
      }
      toast.error("Failed to vote");
    }
  };

  const handleOpenDetails = async (issue: IIssue) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
    setIsFetchingDetails(true);

    try {
      const details = await getIssueById(issue._id);
      setIssues((prev) =>
        prev.map((item) => (item._id === details._id ? { ...item, ...details } : item))
      );
      setSelectedIssue(details);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to load issue details");
        return;
      }
      toast.error("Failed to load issue details");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Community Issues</h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-full min-w-45 sm:w-auto">
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {TAMIL_NADU_DISTRICTS.map((districtName) => (
                <SelectItem key={districtName} value={districtName}>
                  {districtName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full min-w-55 sm:w-auto">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ISSUE_CATEGORIES.map((categoryName) => (
                <SelectItem key={categoryName} value={categoryName}>
                  {categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="inline-flex rounded-lg border p-1 gap-3 ">
            <Button
              size="icon-sm"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              onClick={() => setViewMode("list")}
              
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant={viewMode === "map" ? "secondary" : "ghost"}
              onClick={() => setViewMode("map")}
             
            >
              <MapIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {ISSUE_STATUS.map((statusKey) => (
          <Button
            key={statusKey}
            variant={status === statusKey ? "default" : "outline"}
            className={status === statusKey ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
            onClick={() => setStatus(statusKey)}
          >
            {STATUS_LABELS[statusKey]}
          </Button>
        ))}
      </div>

      {lastFetchMs !== null ? (
        <p className="text-xs text-muted-foreground">Fetched in {lastFetchMs} ms</p>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader className="mr-2 h-5 w-5 animate-spin" />
            Loading community issues...
          </CardContent>
        </Card>
      ) : viewMode === "map" ? (
        <Card>
          <CardContent className="p-3">
            <div className="relative z-0 h-105 overflow-hidden rounded-xl border md:h-115">
              <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {issues.map((issue) => (
                  <CircleMarker
                    key={issue._id}
                    center={[issue.location.lat, issue.location.lng]}
                    radius={8}
                    pathOptions={{ color: statusToColor(issue.status), fillOpacity: 0.85 }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <h3 className="font-semibold">{issue.title}</h3>
                        <p className="text-xs">{issue.category}</p>
                        <p className="text-xs text-muted-foreground">{issue.address}</p>
                        <Badge variant={statusToBadgeVariant(issue.status)}>{statusToLabel(issue.status)}</Badge>
                        <p className="text-xs text-muted-foreground">{formatIssueTime(issue.createdAt)}</p>
                        <Button size="sm" variant="link" className="px-0" onClick={() => handleOpenDetails(issue)}>
                          View details
                        </Button>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No issues found for the selected filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue}
              onVote={handleVote}
              onViewDetails={handleOpenDetails}
              canVote={issue.reportedBy?._id !== user?._id}
              onBlockedVote={() => toast.error("You cannot vote your own report.")}
            />
          ))}
          {hasMore ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading..." : "Show More"}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {!isLoading && viewMode === "map" && hasMore ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading..." : "Show More"}
          </Button>
        </div>
      ) : null}

      <IssueDetailsModal
        open={isModalOpen}
        issue={selectedIssue}
        onClose={() => {
          setIsModalOpen(false);
          setIsFetchingDetails(false);
        }}
        onVote={handleVote}
        canVote={selectedIssue?.reportedBy?._id !== user?._id}
        onBlockedVote={() => toast.error("You cannot vote your own report.")}
        isFetchingDetails={isFetchingDetails}
      />
    </div>
  );
};

export default CommunityIssues;
