import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Camera, ImagePlus, Loader, MapPin, X } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIssue } from "@/modules/citizen/api/issue.api";
import {
  ISSUE_CATEGORIES,
  TAMIL_NADU_DISTRICTS,
} from "@/modules/citizen/constants/issue.constants";
import {
  type ReportIssueFormValues,
  reportIssueSchema,
} from "@/modules/citizen/validation/report-issue.schema";
import { useUserState } from "@/store/user.store";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [11.0168, 76.9558];

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

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

const ReportIssue = () => {
  const user = useUserState((state) => state.user);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const {
    control,
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReportIssueFormValues>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: {
      title: "",
      category: ISSUE_CATEGORIES[0],
      description: "",
      location: {
        lat: DEFAULT_CENTER[0],
        lng: DEFAULT_CENTER[1],
      },
      address: user?.address ?? "",
      district: (user?.district as ReportIssueFormValues["district"]) ?? "Chennai",
      photos: [],
    },
  });

  const location = watch("location");

  const currentPosition = useMemo<[number, number]>(
    () => [location.lat, location.lng],
    [location.lat, location.lng]
  );

  useEffect(() => {
    if (user?.district) {
      setValue("district", user.district as ReportIssueFormValues["district"]);
    }
    if (user?.address) {
      setValue("address", user.address);
    }
  }, [setValue, user?.address, user?.district]);

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
    setValue("location", { lat, lng }, { shouldValidate: true });
    await reverseGeocode(lat, lng);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);

    if (photoPreviews.length + fileArray.length > 5) {
      toast.error("You can upload a maximum of 5 photos.");
      return;
    }

    try {
      const encoded = await Promise.all(fileArray.map((file) => toBase64(file)));
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

  const onSubmit = async (values: ReportIssueFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await createIssue(values);
      toast.success(response.message);
      setPhotoPreviews([]);
      reset({
        title: "",
        category: ISSUE_CATEGORIES[0],
        description: "",
        location: {
          lat: DEFAULT_CENTER[0],
          lng: DEFAULT_CENTER[1],
        },
        address: user?.address ?? "",
        district: (user?.district as ReportIssueFormValues["district"]) ?? "Chennai",
        photos: [],
      });
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

  return (
    <div className="mx-auto max-w-5xl space-y-4 max-h-screen">
      <h1 className="text-2xl font-bold md:text-3xl">Report New Issue</h1>

      <Card>
        <CardContent className="py-4 md:py-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  placeholder="Enter issue title"
                  className={errors.title ? "border-red-500" : ""}
                  {...register("title")}
                />
                {errors.title && (
                  <FieldDescription className="text-red-500">{errors.title.message}</FieldDescription>
                )}
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
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  className={errors.description ? "border-red-500" : ""}
                  {...register("description")}
                />
                {errors.description && (
                  <FieldDescription className="text-red-500">
                    {errors.description.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel>Pin Location on Map</FieldLabel>
                <div className="relative z-0 max-h-64 overflow-hidden rounded-xl border md:h-72">
                  <MapContainer center={currentPosition} zoom={13} className="h-full w-full">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreet</a> contributors'
                    />
                    <LocationPicker position={currentPosition} onPick={handleMapPick} />
                  </MapContainer>
                </div>
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
                  {errors.address && (
                    <FieldDescription className="text-red-500">{errors.address.message}</FieldDescription>
                  )}
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
                  {errors.district && (
                    <FieldDescription className="text-red-500">{errors.district.message}</FieldDescription>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel>Photos (Max 5)</FieldLabel>
                <div className="flex flex-wrap gap-3">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(event) => addFiles(event.target.files)}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={(event) => addFiles(event.target.files)}
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
                {errors.photos && (
                  <FieldDescription className="text-red-500">{errors.photos.message}</FieldDescription>
                )}
              </Field>

              <Button
                type="submit"
                className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
                {isSubmitting && <Loader className="animate-spin" />}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportIssue;
