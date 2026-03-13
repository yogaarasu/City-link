import { useEffect, useMemo, useState } from "react";
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
import { getSocket } from "@/lib/socket";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 10;
const COMMUNITY_CACHE_KEY = "citylink:community-issues-cache:v1";
const COMMUNITY_CACHE_MAX_BYTES = 2_000_000;
const COMMUNITY_CACHE_MAX_ISSUES = 40;
const COMMUNITY_CACHE_MIN_ISSUES = 10;
let isCommunityCacheDisabled = false;
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
  if (isCommunityCacheDisabled) return;

  const isQuotaExceeded = (error: unknown) => {
    if (!(error instanceof DOMException)) return false;
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    );
  };

  const compactIssueForCache = (issue: IIssue): IIssue => ({
    ...issue,
    description:
      issue.description && issue.description.length > 500
        ? `${issue.description.slice(0, 500)}...`
        : issue.description,
    photos: Array.isArray(issue.photos) ? issue.photos.slice(0, 1) : [],
    resolvedEvidencePhotos: issue.resolvedEvidencePhotos?.slice(0, 1),
    statusLogs: undefined,
    review: issue.review
      ? {
          ...issue.review,
          comment:
            issue.review.comment && issue.review.comment.length > 200
              ? `${issue.review.comment.slice(0, 200)}...`
              : issue.review.comment,
        }
      : issue.review,
  });

  const tryWrite = (payload: Record<string, CommunityCacheEntry>) => {
    const serialized = JSON.stringify(payload);
    if (serialized.length > COMMUNITY_CACHE_MAX_BYTES) return false;
    try {
      window.sessionStorage.setItem(COMMUNITY_CACHE_KEY, serialized);
      return true;
    } catch (error: unknown) {
      if (!isQuotaExceeded(error)) {
        return true;
      }
      return false;
    }
  };

  let current: Record<string, CommunityCacheEntry> = {};
  try {
    const currentRaw = window.sessionStorage.getItem(COMMUNITY_CACHE_KEY);
    current = currentRaw ? (JSON.parse(currentRaw) as Record<string, CommunityCacheEntry>) : {};
  } catch {
    current = {};
  }

  const trimmedIssues =
    entry.issues.length > COMMUNITY_CACHE_MAX_ISSUES
      ? entry.issues.slice(0, COMMUNITY_CACHE_MAX_ISSUES)
      : entry.issues;
  const compactEntry: CommunityCacheEntry = {
    ...entry,
    issues: trimmedIssues.map(compactIssueForCache),
  };

  if (tryWrite({ ...current, [filterKey]: entry })) return;
  if (tryWrite({ [filterKey]: compactEntry })) return;
  if (
    tryWrite({
      [filterKey]: {
        ...compactEntry,
        issues: compactEntry.issues.slice(0, COMMUNITY_CACHE_MIN_ISSUES),
      },
    })
  )
    return;

  try {
    window.sessionStorage.removeItem(COMMUNITY_CACHE_KEY);
  } catch {
    // ignore cleanup errors
  }
  isCommunityCacheDisabled = true;
};

const CommunityIssues = () => {
  const user = useUserState((state) => state.user);
  const [district, setDistrict] = useState(DEFAULT_DISTRICT_FILTER);
  const [category, setCategory] = useState(DEFAULT_CATEGORY_FILTER);
  const [status, setStatus] = useState(DEFAULT_STATUS_FILTER);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const queryClient = useQueryClient();
  
  const filterKey = useMemo(
    () => getCommunityFilterKey(district, category, status),
    [district, category, status]
  );
  const cached = useMemo(() => readCommunityCache(filterKey), [filterKey]);

  const communityQuery = useInfiniteQuery({
    queryKey: ["communityIssues", district, category, status],
    queryFn: ({ pageParam }) =>
      getCommunityIssues({
        district,
        category,
        status,
        page: pageParam as number,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1, // Added for TanStack Query v5 compatibility
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialData: cached
      ? {
          pages: [
            {
              issues: cached.issues,
              page: cached.page,
              hasMore: cached.hasMore,
              total: cached.issues.length,
              limit: PAGE_SIZE,
            },
          ],
          pageParams: [cached.page],
        }
      : undefined,
  });

  const pages = communityQuery.data?.pages ?? [];
  const issues = pages.flatMap((page) => page.issues);
  const lastPage = pages[pages.length - 1];
  const hasMore = Boolean(lastPage?.hasMore);
  const isLoading = communityQuery.isLoading;
  const isLoadingMore = communityQuery.isFetchingNextPage;

  // New useEffect to handle errors correctly in TanStack Query v5
  useEffect(() => {
    if (communityQuery.isError && communityQuery.error) {
      if (communityQuery.error instanceof AxiosError) {
        toast.error(communityQuery.error.response?.data?.error ?? "Failed to load community issues");
      } else {
        toast.error("Failed to load community issues");
      }
    }
  }, [communityQuery.isError, communityQuery.error]);

  useEffect(() => {
    if (!communityQuery.data) return;
    const last = communityQuery.data.pages[communityQuery.data.pages.length - 1];
    writeCommunityCache(filterKey, {
      issues,
      page: last?.page || 1,
      hasMore: Boolean(last?.hasMore),
    });
  }, [communityQuery.data, filterKey, issues]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const socket = getSocket();
    const onIssueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["communityIssues", district, category, status] });
    };

    socket.on("issue:created", onIssueUpdate);
    socket.on("issue:updated", onIssueUpdate);
    socket.on("issue:voted", onIssueUpdate);
    socket.on("issue:reviewed", onIssueUpdate);

    return () => {
      socket.off("issue:created", onIssueUpdate);
      socket.off("issue:updated", onIssueUpdate);
      socket.off("issue:voted", onIssueUpdate);
      socket.off("issue:reviewed", onIssueUpdate);
    };
  }, [category, district, queryClient, status]);

  const handleLoadMore = async () => {
    try {
      if (!communityQuery.hasNextPage) return;
      await communityQuery.fetchNextPage();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to load more issues");
        return;
      }
      toast.error("Failed to load more issues");
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
      queryClient.setQueryData(["communityIssues", district, category, status], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page: any) => ({
            ...page,
            issues: page.issues.map((item: IIssue) => (item._id === issueId ? updated : item)),
          })),
        };
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
      queryClient.setQueryData(["communityIssues", district, category, status], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page: any) => ({
            ...page,
            issues: page.issues.map((item: IIssue) =>
              item._id === details._id ? { ...item, ...details } : item
            ),
          })),
        };
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
                    pathOptions={{
                      color: statusToColor(issue.status),
                      fillColor: statusToColor(issue.status),
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
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