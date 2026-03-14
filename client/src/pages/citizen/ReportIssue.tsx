import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Camera, ImagePlus, Loader, LocateFixed, MapPin, ThumbsUp, X } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IssueDetailsModal } from "@/modules/citizen/components/IssueDetailsModal";
import { checkDuplicateIssues, createIssue, getIssueById, voteIssue } from "@/modules/citizen/api/issue.api";
import { ISSUE_CATEGORIES, TAMIL_NADU_DISTRICTS } from "@/modules/citizen/constants/issue.constants";
import { MAX_REPORT_ISSUE_PHOTOS } from "@/modules/citizen/constants/report-issue-upload.constants";
import type { IIssue } from "@/modules/citizen/types/issue.types";
import { statusToLabel } from "@/modules/citizen/utils/issue-ui";
import { compressIssuePhotoFiles } from "@/modules/citizen/utils/report-issue-image.utils";
import { reportIssueSchema, type ReportIssueFormValues } from "@/modules/citizen/validation/report-issue.schema";
import { useUserState } from "@/store/user.store";
import { cleanProfanity } from "@/lib/profanity";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [11.0168, 76.9558];
const DUPLICATE_RADIUS_METERS = 500;
const STEP_HELPER_TEXT: Record<1 | 2, string> = {
  1: "Step 1: Fill details and pin location.",
  2: "Step 2: Open nearby reports and decide.",
};

const markerIcon = new L.Icon({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  onPick: (lat: number, lng: number) => void;
  position: [number, number];
}

const LocationPicker = ({ onPick, position }: LocationPickerProps) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return <Marker position={position} icon={markerIcon} />;
};

const StepCircle = ({
  step,
  active,
  completed,
}: {
  step: number;
  active: boolean;
  completed: boolean;
}) => (
  <span
    className={cn(
      "relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
      completed && "border-emerald-600 bg-emerald-600 text-white",
      active && !completed && "border-emerald-600 bg-white text-emerald-700",
      !active && !completed && "border-emerald-600 bg-white text-emerald-600"
    )}
  >
    {step}
  </span>
);

const ReportIssue = () => {
  const user = useUserState((state) => state.user);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [duplicateIssues, setDuplicateIssues] = useState<IIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [isIssueDetailsOpen, setIsIssueDetailsOpen] = useState(false);
  const [isFetchingIssueDetails, setIsFetchingIssueDetails] = useState(false);
  const [pendingReportValues, setPendingReportValues] = useState<ReportIssueFormValues | null>(null);
  const [isLocationPinned, setIsLocationPinned] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const defaultValues: ReportIssueFormValues = {
    title: "",
    category: ISSUE_CATEGORIES[0],
    description: "",
    location: {
      lat: DEFAULT_CENTER[0],
      lng: DEFAULT_CENTER[1],
    },
    address: "",
    district: "",
    photos: [],
  };

  const { control, register, setValue, handleSubmit, reset, watch, formState: { errors } } =
    useForm<ReportIssueFormValues>({
      resolver: zodResolver(reportIssueSchema),
      defaultValues,
    });

  const location = watch("location");

  const currentPosition = useMemo<[number, number]>(
    () => [location.lat, location.lng],
    [location.lat, location.lng]
  );

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = (await response.json()) as {
        display_name?: string;
        address?: {
          state_district?: string;
          county?: string;
          city?: string;
        };
      };

      if (data.display_name) {
        setValue("address", data.display_name, { shouldValidate: true });
      }

      const districtCandidate =
        data.address?.state_district || data.address?.county || data.address?.city || "";

      if (districtCandidate) {
        const normalized = districtCandidate.replace(" District", "").toLowerCase();
        const matched = TAMIL_NADU_DISTRICTS.find(
          (district) =>
            district.toLowerCase() === normalized ||
            district.toLowerCase().includes(normalized) ||
            normalized.includes(district.toLowerCase())
        );
        if (matched) {
          setValue("district", matched, { shouldValidate: true });
        }
      }
    } catch {
      toast.error("Unable to fetch address from map location.");
    }
  };

  const handleMapPick = async (lat: number, lng: number) => {
    setIsLocationPinned(true);
    setValue("location", { lat, lng }, { shouldValidate: true });
    await reverseGeocode(lat, lng);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        mapRef.current?.setView([lat, lng], 16);
        await handleMapPick(lat, lng);
        setIsLocating(false);
      },
      () => {
        toast.error("Unable to access your location. Please pin manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const addFiles = async (
    files: FileList | null,
    options?: { watermarkText?: string; watermarkLogoSrc?: string }
  ) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const remainingSlots = Math.max(0, MAX_REPORT_ISSUE_PHOTOS - photoPreviews.length);

    if (remainingSlots === 0) {
      toast.error(`You can upload a maximum of ${MAX_REPORT_ISSUE_PHOTOS} photos.`);
      return;
    }

    const filesToProcess = fileArray.slice(0, remainingSlots);
    const ignoredCount = fileArray.length - filesToProcess.length;

    if (ignoredCount > 0) {
      toast.warning(
        `Maximum ${MAX_REPORT_ISSUE_PHOTOS} photos allowed. ${ignoredCount} extra image(s) were skipped.`
      );
    }

    try {
      const encoded = await compressIssuePhotoFiles(filesToProcess, options);
      const merged = [...photoPreviews, ...encoded];
      setPhotoPreviews(merged);
      setValue("photos", merged, { shouldValidate: true });
    } catch {
      toast.error("Failed to process one or more files.");
    }
  };

  const removePhoto = (index: number) => {
    const filtered = photoPreviews.filter((_, idx) => idx !== index);
    setPhotoPreviews(filtered);
    setValue("photos", filtered, { shouldValidate: true });
  };

  const submitNewIssue = async (values: ReportIssueFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await createIssue(values);
      toast.success(response.message);
      setStep(1);
      setDuplicateIssues([]);
      setPendingReportValues(null);
      setPhotoPreviews([]);
      setIsLocationPinned(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("citylink:citizen-dashboard-cache");
        window.sessionStorage.removeItem("citylink:community-issues-cache:v1");
      }
      reset(defaultValues);
      mapRef.current?.setView(DEFAULT_CENTER, 13);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to submit issue");
        return;
      }
      toast.error("Failed to submit issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCheckDuplicates = async (values: ReportIssueFormValues) => {
    if (!isLocationPinned) {
      toast.error("Pin your issue location on the map before continuing.");
      return;
    }

    try {
      setIsCheckingDuplicates(true);
      setPendingReportValues(values);
      const nearbyIssues = await checkDuplicateIssues({
        category: values.category,
        district: values.district,
        location: values.location,
        radiusMeters: DUPLICATE_RADIUS_METERS,
      });
      setDuplicateIssues(nearbyIssues);
      setStep(2);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to check nearby issues");
        return;
      }
      toast.error("Failed to check nearby issues");
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleUpvoteDuplicateIssue = async (issue: IIssue) => {
    if (issue.reportedBy?._id === user?._id) {
      toast.error("You cannot upvote your own report.");
      return;
    }

    try {
      const updated = await voteIssue(issue._id, "up");
      setDuplicateIssues((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? {
                ...item,
                ...updated,
                distanceMeters: item.distanceMeters,
              }
            : item
        )
      );
      toast.success("Upvoted existing issue. Thank you for supporting this report.");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to upvote issue");
        return;
      }
      toast.error("Failed to upvote issue");
    }
  };

  const handleReportAsNew = async () => {
    if (!pendingReportValues) {
      toast.error("Please complete Step 1 first.");
      setStep(1);
      return;
    }
    await submitNewIssue(pendingReportValues);
  };

  const handleOpenIssueDetails = async (issue: IIssue) => {
    setSelectedIssue(issue);
    setIsIssueDetailsOpen(true);
    try {
      setIsFetchingIssueDetails(true);
      const latestIssue = await getIssueById(issue._id);
      setSelectedIssue(latestIssue);
      setDuplicateIssues((prev) =>
        prev.map((item) =>
          item._id === latestIssue._id
            ? {
                ...latestIssue,
                distanceMeters: item.distanceMeters,
              }
            : item
        )
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to load issue details");
        return;
      }
      toast.error("Failed to load issue details");
    } finally {
      setIsFetchingIssueDetails(false);
    }
  };

  const handleVoteFromDetails = async (issueId: string, type: "up" | "down") => {
    try {
      const updated = await voteIssue(issueId, type);
      setDuplicateIssues((prev) =>
        prev.map((item) =>
          item._id === updated._id
            ? {
                ...item,
                ...updated,
                distanceMeters: item.distanceMeters,
              }
            : item
        )
      );
      setSelectedIssue((prev) =>
        prev && prev._id === updated._id
          ? {
              ...prev,
              ...updated,
              distanceMeters: prev.distanceMeters,
            }
          : prev
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to vote issue");
        return;
      }
      toast.error("Failed to vote issue");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 overflow-x-hidden pb-4">
      <h1 className="text-2xl font-bold md:text-3xl">Report New Issue</h1>

      <div className="mx-auto flex max-w-sm items-center justify-center gap-4">
        <div className="w-full max-w-[220px] sm:max-w-xs">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-6 right-6 h-px rounded-full bg-emerald-200 sm:left-5 sm:right-5 sm:h-0.5" />
            <div
              className={cn(
                "absolute left-6 h-px rounded-full bg-emerald-600 transition-all duration-500 ease-in-out sm:left-5 sm:h-0.5",
                step === 2 ? "right-6 sm:right-5" : "right-[calc(100%-1.5rem)] sm:right-[calc(100%-1.25rem)]"
              )}
            />
            <StepCircle step={1} active={step === 1} completed={step === 2} />
            <StepCircle step={2} active={step === 2} completed={false} />
          </div>
          <div className="relative mt-2 h-10 text-[10px] leading-snug sm:h-9 sm:text-xs">
            <p
              className={cn(
                "absolute left-0 w-24 -translate-x-1/4 px-1 text-center sm:w-28",
                step === 1 ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {STEP_HELPER_TEXT[1]}
            </p>
            <p
              className={cn(
                "absolute right-0 w-28 translate-x-1/4 px-1 text-center sm:w-32",
                step === 2 ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="block whitespace-nowrap">Step 2: Open nearby reports.</span>
              <span className="block whitespace-nowrap">Upvote same issue or report new.</span>
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="py-4 md:py-6">
          {step === 1 ? (
            <form onSubmit={handleSubmit(onCheckDuplicates)} className="touch-pan-y">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input
                    id="title"
                    placeholder="Enter issue title"
                    className={errors.title ? "border-red-500" : ""}
                    {...register("title")}
                  />
                  {errors.title ? (
                    <FieldDescription className="text-red-500">{errors.title.message}</FieldDescription>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel>Category</FieldLabel>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ISSUE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <Textarea
                        id="description"
                        placeholder="Describe the issue in detail..."
                        className={errors.description ? "border-red-500" : ""}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(cleanProfanity(event.target.value))
                        }
                      />
                    )}
                  />
                  {errors.description ? (
                    <FieldDescription className="text-red-500">{errors.description.message}</FieldDescription>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel>Pin Location on Map</FieldLabel>
                  <div className="relative z-0 h-64 overflow-hidden rounded-xl border touch-pan-y md:h-72">
                    <MapContainer
                      center={currentPosition}
                      zoom={13}
                      className="h-full w-full touch-pan-y"
                      ref={mapRef}
                      scrollWheelZoom={false}
                      dragging
                      touchZoom
                      doubleClickZoom
                      boxZoom={false}
                      keyboard={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreet</a> contributors'
                      />
                      <LocationPicker position={currentPosition} onPick={handleMapPick} />
                    </MapContainer>
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      className="absolute top-2 right-2 z-400 inline-flex items-center gap-1 rounded-md border bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm hover:bg-background"
                      disabled={isLocating}
                    >
                      <LocateFixed className={cn("h-3.5 w-3.5", isLocating && "animate-spin")} />
                      {isLocating ? "Locating..." : "Locate Me"}
                    </button>
                  </div>
                  {!isLocationPinned ? (
                    <FieldDescription className="text-muted-foreground">
                      Pin your exact issue location to continue to Step 2.
                    </FieldDescription>
                  ) : null}
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <div className="relative">
                      <MapPin className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                      <Input
                        id="address"
                        className={cn("pl-11", errors.address ? "border-red-500" : "")}
                        {...register("address")}
                      />
                    </div>
                    {errors.address ? (
                      <FieldDescription className="text-red-500">{errors.address.message}</FieldDescription>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel>District</FieldLabel>
                    <Controller
                      control={control}
                      name="district"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className={errors.district ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAMIL_NADU_DISTRICTS.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.district ? (
                      <FieldDescription className="text-red-500">{errors.district.message}</FieldDescription>
                    ) : null}
                  </Field>
                </div>

                <Field>
                <FieldLabel>Photos (Required, Max {MAX_REPORT_ISSUE_PHOTOS})</FieldLabel>
                  <div className="flex flex-wrap gap-3">
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(event) => {
                        void addFiles(event.target.files, { watermarkText: "by CityLink", watermarkLogoSrc: "/citylink-logo-new.png" });
                        event.target.value = "";
                      }}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={(event) => {
                        void addFiles(event.target.files, { watermarkText: "by CityLink", watermarkLogoSrc: "/citylink-logo-new.png" });
                        event.target.value = "";
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="text-muted-foreground hover:border-emerald-400 flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed"
                    >
                      <ImagePlus className="mb-2 h-6 w-6" />
                      Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="text-muted-foreground hover:border-emerald-400 flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed"
                    >
                      <Camera className="mb-2 h-6 w-6 text-emerald-600" />
                      Camera
                    </button>

                    {photoPreviews.map((photo, index) => (
                      <div key={`${photo}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg">
                        <img src={photo} alt={`Evidence ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 rounded-full bg-red-500 p-0.5 text-white"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FieldDescription className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                    Please upload original evidence that includes a geo‑location, date, and time watermark.
                    Submissions without this may be rejected.
                  </FieldDescription>
                  {errors.photos ? (
                    <FieldDescription className="text-red-500">{errors.photos.message}</FieldDescription>
                  ) : null}
                </Field>

                <Button
                  type="submit"
                  className="mt-2 w-full bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={isCheckingDuplicates}
                >
                  {isCheckingDuplicates ? "Checking Nearby Issues..." : "Continue to Step 2"}
                  {isCheckingDuplicates ? <Loader className="animate-spin" /> : null}
                </Button>
              </FieldGroup>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/25 p-3">
                <h2 className="font-semibold">Nearby Reports in {DUPLICATE_RADIUS_METERS}m (Same Category)</h2>
                <p className="text-sm text-muted-foreground">
                  If your issue is already reported nearby, upvote it instead of creating a duplicate report.
                </p>
              </div>

              {duplicateIssues.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No nearby issue found for this category. You can report this as a new issue.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {duplicateIssues.map((issue) => (
                    <button
                      key={issue._id}
                      type="button"
                      className="w-full space-y-2 rounded-lg border p-3 text-left transition hover:border-emerald-400"
                      onClick={() => handleOpenIssueDetails(issue)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold">{issue.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-md border px-2 py-1">
                            {issue.category}
                          </Badge>
                          <Badge variant="outline" className="rounded-md border px-2 py-1">
                            {statusToLabel(issue.status)}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.address}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">
                          Distance: {issue.distanceMeters ?? "-"}m | Votes: {issue.upVotes}
                        </span>
                        <Button
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleUpvoteDuplicateIssue(issue);
                          }}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          +1 Upvote This Report
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                If you report an already reported issue, your issue can be rejected.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  className="bg-emerald-500 text-white hover:bg-emerald-600"
                  onClick={handleReportAsNew}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Report as New"}
                  {isSubmitting ? <Loader className="animate-spin" /> : null}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <IssueDetailsModal
        open={isIssueDetailsOpen}
        issue={selectedIssue}
        onClose={() => setIsIssueDetailsOpen(false)}
        onVote={handleVoteFromDetails}
        currentUserId={user?._id}
        canVote={selectedIssue?.reportedBy?._id !== user?._id}
        onBlockedVote={() => toast.error("You cannot vote your own report.")}
        isFetchingDetails={isFetchingIssueDetails}
      />
    </div>
  );
};

export default ReportIssue;
