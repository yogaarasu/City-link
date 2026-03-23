import React, { useEffect, useMemo, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, MapPin, LocateFixed } from "lucide-react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Link, useNavigate } from "react-router-dom"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/axios"
import { AxiosError } from "axios"
import { toast } from "sonner"
import { AUTHORIZE } from "@/utils/constants"
import { useI18n } from "@/modules/i18n/useI18n"
import { buildPasswordSchema } from "@/modules/auth/validation/password.schema"

// Fix for default Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Official 38 Districts List
const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", 
  "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", 
  "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", 
  "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", 
  "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", 
  "Tirupattur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", 
  "Viluppuram", "Virudhunagar"
].sort();

const SIGNUP_OTP_SESSION_KEY = "citylink:signup-otp-email";
type ReverseGeocodeAddress = {
  city?: string;
  city_district?: string;
  county?: string;
  municipality?: string;
  state_district?: string;
  suburb?: string;
  town?: string;
  village?: string;
};

type ReverseGeocodeResponse = {
  display_name?: string;
  address?: ReverseGeocodeAddress;
};

const normalizeDistrictValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/\bdistrict\b/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchTamilNaduDistrict = (candidates: string[]) => {
  const normalizedCandidates = candidates
    .map((item) => normalizeDistrictValue(item))
    .filter(Boolean);

  return TAMIL_NADU_DISTRICTS.find((district) => {
    const normalizedDistrict = normalizeDistrictValue(district);
    return normalizedCandidates.some(
      (candidate) =>
        candidate === normalizedDistrict ||
        candidate.includes(normalizedDistrict) ||
        normalizedDistrict.includes(candidate)
    );
  });
};

const resolveDistrictFromReverseGeocode = (data: ReverseGeocodeResponse) => {
  const address = data.address ?? {};
  const displayParts = (data.display_name ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    matchTamilNaduDistrict([
      address.state_district ?? "",
      address.county ?? "",
      address.city_district ?? "",
      address.city ?? "",
      address.town ?? "",
      address.village ?? "",
      address.municipality ?? "",
      address.suburb ?? "",
      ...displayParts,
    ]) ?? ""
  );
};

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const response = await api.get<ReverseGeocodeResponse>("/geocode/reverse", {
      params: { lat, lng },
    });
    return response.data;
  } catch {
    return null;
  }
};

type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  district: string;
  address: string;
  password: string;
  confirmPassword: string;
};

// 2. Leaflet Map Helper Component
function AddressMapHelper({
  onAddressSelect
}: {
  onAddressSelect: (address: string, district: string) => void
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();
  const latestRequestId = useRef(0);
  const locateButtonRef = useRef<HTMLButtonElement | null>(null);
  const { t } = useI18n();

  useMapEvents({
    async click(e: L.LeafletMouseEvent) { 
      setPosition(e.latlng);
      await fetchAddress(e.latlng.lat, e.latlng.lng);
    },
  });

  const fetchAddress = async (lat: number, lng: number) => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    const data = await reverseGeocode(lat, lng);
    if (!data) {
      toast.error(t("authLocationFetchFailed"));
      return;
    }

    if (requestId !== latestRequestId.current) {
      return;
    }

    const district = resolveDistrictFromReverseGeocode(data);
    onAddressSelect(data.display_name ?? "", district);
  };

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error(t("authGeolocationUnsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const latlng = L.latLng(latitude, longitude);
        setPosition(latlng);
        map.flyTo(latlng, Math.max(map.getZoom(), 16));
        if (accuracy && accuracy > 100) {
          toast.warning(t("authLowAccuracyWarning"));
        }
        await fetchAddress(latitude, longitude);
      },
      () => {
        toast.error(t("authLocationAccessFailed"));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (!locateButtonRef.current) return;
    L.DomEvent.disableClickPropagation(locateButtonRef.current);
    L.DomEvent.disableScrollPropagation(locateButtonRef.current);
  }, []);

  return (
    <>
      {position && <Marker position={position} />}
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control">
          <Button
            ref={locateButtonRef}
            type="button"
            variant="secondary"
            size="sm"
            className="mt-[1px] mr-[1px] border border-border bg-background/95 shadow-sm hover:bg-background"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              locateUser();
            }}
          >
            <LocateFixed className="w-4 h-4 mr-2" />
            {t("authLocateMe")}
          </Button>
        </div>
      </div>
    </>
  );
}

// 3. Main Signup Component
export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const isTamil = language === "ta";

  const signupSchema = useMemo(() => {
    const nameRegex = /^\p{L}+$/u;
    const passwordSchema = buildPasswordSchema(t);

    return z.object({
      firstName: z
        .string()
        .trim()
        .min(2, t("authFirstNameMin"))
        .regex(nameRegex, t("authNameLettersOnly")),
      lastName: z
        .string()
        .trim()
        .min(1, t("authLastNameRequired"))
        .regex(nameRegex, t("authNameLettersOnly")),
      email: z.string().trim().email(t("authInvalidEmail")),
      district: z.string().min(2, t("authDistrictRequired")),
      address: z.string().trim().min(5, t("authAddressRequired")),
      password: passwordSchema,
      confirmPassword: z.string().min(1, t("authConfirmPasswordRequired")),
    }).refine((data) => data.password === data.confirmPassword, {
      message: t("authPasswordsNoMatch"),
      path: ["confirmPassword"],
    });
  }, [t, language]);

  const {
    register,
    handleSubmit,
    setValue,
    control, // Needed for shadcn Select
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const res = await api.post("/auth/register", data);
      if (res.data.success) {
        toast.success(res.data.message);
        sessionStorage.setItem(SIGNUP_OTP_SESSION_KEY, data.email.trim().toLowerCase());
        navigate(`/auth/otp?email=${data.email}`, { state: { isAuthorized: AUTHORIZE }});
      }
    } catch (error: unknown) {
      const errMessage = error instanceof AxiosError ? error.response?.data?.error : String(error);
      console.error(errMessage);
      toast.error(errMessage.slice(0, 80)); 
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">{t("authSignupTitle")}</h1>
            <FieldDescription className="text-base">
              {t("authAlreadyHaveAccount")}{" "}
              <Link to="/auth/login" replace className="text-emerald-500  hover:underline" viewTransition>
                {t("authLogIn")}
              </Link>
            </FieldDescription>
          </div>
          <Separator />
          <FieldDescription className="text-center pb-4 text-base">
            {t("authPlatformDescription")}
          </FieldDescription>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="firstName" className="text-base">{t("authFirstNameLabel")}</FieldLabel>
              <Input
                id="firstName"
                placeholder={t("authFirstNamePlaceholder")}
                {...register("firstName")}
                className={cn("h-10 text-base", errors.firstName ? "border-red-500" : "")}
              />
              {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName" className="text-base">{t("authLastNameLabel")}</FieldLabel>
              <Input
                id="lastName"
                placeholder={t("authLastNamePlaceholder")}
                {...register("lastName")}
                className={cn("h-10 text-base", errors.lastName ? "border-red-500" : "")}
              />
              {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="email" className="text-base">{t("email")}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={t("authEmailPlaceholder")}
              {...register("email")}
              className={cn("h-10 text-base", errors.email ? "border-red-500" : "")}
            />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </Field>

          {/* Address with Map Integration */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="address" className="text-base">{t("authAddressLabel")}</FieldLabel>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-sm text-emerald-500 flex items-center gap-1 hover:underline"
              >
                <MapPin className="w-3 h-3" />
                {showMap ? t("authHideMap") : t("authPinLocation")}
              </button>
            </div>

            {showMap && (
              <div className="h-60 w-full rounded-md overflow-hidden border border-border relative mb-2 z-0">
                <MapContainer
                  center={[11.136137,79.077626]}
                  zoom={12}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  />
                  <AddressMapHelper
                    onAddressSelect={(fetchedAddress, fetchedDistrict) => {
                      setValue("address", fetchedAddress, { shouldValidate: true });

                      if (fetchedDistrict) {
                        setValue("district", fetchedDistrict, { shouldValidate: true });
                      }
                    }}
                  />
                </MapContainer>
              </div>
            )}

            <Input
              id="address"
              placeholder={t("authAddressPlaceholder")}
              {...register("address")}
              className={cn("h-10 text-base", errors.address ? "border-red-500" : "")}
            />
            {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
          </Field>

          {/* District Selection (Shadcn) */}
          <Field>
            <FieldLabel className="text-base">{t("authDistrictLabel")}</FieldLabel>
            <Controller
              control={control}
              name="district"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <SelectTrigger className={cn("h-10 text-base", errors.district ? "border-red-500" : "")}>
                    <SelectValue placeholder={t("authDistrictPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TAMIL_NADU_DISTRICTS.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.district && <span className="text-xs text-red-500">{errors.district.message}</span>}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel
                htmlFor="password"
                className={cn("text-base", isTamil ? "min-h-[2.75rem]" : "")}
              >
                {t("authPasswordLabel")}
              </FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={cn("h-10 pr-10 text-base", errors.password ? "border-red-500" : "")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
            </Field>

            <Field>
              <FieldLabel
                htmlFor="confirmPassword"
                className={cn("text-base", isTamil ? "min-h-[2.75rem]" : "")}
              >
                {t("authConfirmPasswordLabel")}
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={cn("h-10 text-base", errors.confirmPassword ? "border-red-500" : "")}
              />
              {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>}
            </Field>
          </div>

          <Field className="pt-4">
            <Button type="submit" className="h-10 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-base" disabled={isSubmitting}>
              {isSubmitting ? t("authCreatingAccount") : t("authCreateAccount")}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-base">
        {t("authAgreeTermsPrefix")}{" "}
        <a href="#" className="underline hover:text-[#129141]">{t("authTerms")}</a>{" "}
        {t("authAnd")}{" "}
        <a href="#" className="underline hover:text-[#129141]">{t("authPrivacy")}</a>
        {t("authAgreeTermsSuffix")}
      </FieldDescription>
    </div>
  )
}

