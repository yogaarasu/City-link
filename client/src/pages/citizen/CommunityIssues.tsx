import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { List, Map as MapIcon } from "lucide-react";
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
import { IssueCardSkeletonList } from "@/modules/citizen/components/IssueCardSkeleton";
import { IssueDetailsModal } from "@/modules/citizen/components/IssueDetailsModal";
import { useUserState } from "@/store/user.store";
import "leaflet/dist/leaflet.css";

const PAGE_SIZE = 10;
const COMMUNITY_CACHE_KEY = "citylink:community-issues-cache:v1";
const DEFAULT_DISTRICT_FILTER = "all";
const DEFAULT_CATEGORY_FILTER = "all";
const DEFAULT_STATUS_FILTER = "all";

type CommunityCacheEntry = {
  issues: IIssue[];
  page: number;
  hasMore: boolean;
};

const getCommunityFilterKey = (district: string, category: string, status: string) =>
  `${district}__${category}__${status}`;

const readCommunityCache = (filterKey: string): CommunityCacheEntry | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(COMMUNITY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, CommunityCacheEntry>;
    const entry = parsed[filterKey];
    if (!entry || !Array.isArray(entry.issues)) return null;
    return entry;
  } catch {
    return null;
  }
};

const writeCommunityCache = (filterKey: string, entry: CommunityCacheEntry) => {
  if (typeof window === "undefined") return;
  const currentRaw = window.sessionStorage.getItem(COMMUNITY_CACHE_KEY);
  const current = currentRaw ? (JSON.parse(currentRaw) as Record<string, CommunityCacheEntry>) : {};
  current[filterKey] = entry;
  window.sessionStorage.setItem(COMMUNITY_CACHE_KEY, JSON.stringify(current));
};

const CommunityIssues = () => {
  const user = useUserState((state) => state.user);
  const [district, setDistrict] = useState(DEFAULT_DISTRICT_FILTER);
  const [category, setCategory] = useState(DEFAULT_CATEGORY_FILTER);
  const [status, setStatus] = useState(DEFAULT_STATUS_FILTER);
  const [initialCache] = useState(() =>
    readCommunityCache(
      getCommunityFilterKey(
        DEFAULT_DISTRICT_FILTER,
        DEFAULT_CATEGORY_FILTER,
        DEFAULT_STATUS_FILTER
      )
    )
  );
  const [issues, setIssues] = useState<IIssue[]>(initialCache?.issues || []);
  const [isLoading, setIsLoading] = useState(!initialCache);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(initialCache?.page || 1);
  const [hasMore, setHasMore] = useState(initialCache?.hasMore || false);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const requestIdRef = useRef(0);
  const filterKey = useMemo(
    () => getCommunityFilterKey(district, category, status),
    [district, category, status]
  );

  useEffect(() => {
    const cached = readCommunityCache(filterKey);
    if (cached) {
      setIssues(cached.issues);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setIsLoading(false);
    }

    const load = async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      try {
        if (!cached) {
          setIssues([]);
          setPage(1);
          setHasMore(false);
          setIsLoading(true);
        }
        const response = await getCommunityIssues({
          district,
          category,
          status,
          page: 1,
          limit: PAGE_SIZE,
        });

        if (requestId !== requestIdRef.current) return;

        const nextIssues = response.issues;
        setIssues(nextIssues);
        setPage(response.page);
        setHasMore(response.hasMore);
        writeCommunityCache(filterKey, {
          issues: nextIssues,
          page: response.page,
          hasMore: response.hasMore,
        });
      } catch (error: unknown) {
        if (requestId !== requestIdRef.current) return;
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error ?? "Failed to load community issues");
          return;
        }
        toast.error("Failed to load community issues");
      } finally {
        if (requestId === requestIdRef.current && !cached) {
          setIsLoading(false);
        }
      }
    };

    void load();
  }, [district, category, status, filterKey]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

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
        const nextIssues = [...prev, ...incoming];
        writeCommunityCache(filterKey, {
          issues: nextIssues,
          page: response.page,
          hasMore: response.hasMore,
        });
        return nextIssues;
      });
      setPage(response.page);
      setHasMore(response.hasMore);
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
      setIssues((prev) => {
        const nextIssues = prev.map((item) => (item._id === issueId ? updated : item));
        writeCommunityCache(filterKey, {
          issues: nextIssues,
          page,
          hasMore,
        });
        return nextIssues;
      });
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
      setIssues((prev) => {
        const nextIssues = prev.map((item) =>
          item._id === details._id ? { ...item, ...details } : item
        );
        writeCommunityCache(filterKey, {
          issues: nextIssues,
          page,
          hasMore,
        });
        return nextIssues;
      });
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

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-full sm:w-auto xl:min-w-45">
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
            <SelectTrigger className="w-full sm:w-auto xl:min-w-55">
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

          <div className="inline-flex w-full items-center gap-2 rounded-lg border p-1 sm:w-auto">
            <Button
              size="sm"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              className="flex-1 sm:flex-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              <span className="sm:hidden">List</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "map" ? "secondary" : "ghost"}
              className="flex-1 sm:flex-none"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-4 w-4" />
              <span className="sm:hidden">Map</span>
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

      {isLoading ? (
        <IssueCardSkeletonList count={5} />
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
