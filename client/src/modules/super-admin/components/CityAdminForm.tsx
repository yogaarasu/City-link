import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TAMIL_NADU_DISTRICTS, getDistrictLabel } from "@/modules/citizen/constants/issue.constants";
import type { CityAdminPayload } from "../types/super-admin.types";
import { useI18n } from "@/modules/i18n/useI18n";
import { buildPasswordSchema } from "@/modules/auth/validation/password.schema";

interface CityAdminFormProps {
  initialValues?: CityAdminPayload;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: CityAdminPayload) => Promise<void> | void;
  onCancel?: () => void;
}

const defaultValues: CityAdminPayload = {
  name: "",
  email: "",
  phone: "",
  district: "Chennai",
  password: "",
};

const NAME_REGEX = /^[A-Za-z\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidIndianPhoneDigits = (digits: string) => {
  if (!/^[6-9]\d{9}$/.test(digits)) return false;
  if (new Set(digits.split("")).size === 1) return false;

  let increasing = true;
  let decreasing = true;
  for (let index = 1; index < digits.length; index += 1) {
    const previous = Number(digits[index - 1]);
    const current = Number(digits[index]);
    if (current !== previous + 1) increasing = false;
    if (current !== previous - 1) decreasing = false;
  }

  if (increasing || decreasing) return false;
  return true;
};

const CityAdminForm = ({
  initialValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: CityAdminFormProps) => {
  const { t } = useI18n();
  const passwordSchema = buildPasswordSchema(t);
  const [form, setForm] = useState<CityAdminPayload>({
    ...defaultValues,
    ...initialValues,
    phone: String(initialValues?.phone || "")
      .replace(/\D/g, "")
      .replace(/^91/, "")
      .slice(0, 10),
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const updateField = (key: keyof CityAdminPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    } = {};
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phoneDigits = form.phone.replace(/\D/g, "").slice(0, 10);

    if (name.length < 2) nextErrors.name = t("errorNameMin");
    if (name && !NAME_REGEX.test(name)) {
      nextErrors.name = t("errorNameLettersOnly");
    }
    if (!EMAIL_REGEX.test(email)) nextErrors.email = t("authInvalidEmail");
    if (phoneDigits.length !== 10) {
      nextErrors.phone = t("errorPhoneDigits");
    } else if (!isValidIndianPhoneDigits(phoneDigits)) {
      nextErrors.phone =
        t("errorPhonePattern");
    }
    const passwordResult = passwordSchema.safeParse(form.password);
    if (!passwordResult.success) {
      nextErrors.password =
        passwordResult.error.issues[0]?.message ?? t("authPasswordMinLength");
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      name,
      email,
      phone: `+91${phoneDigits}`,
      district: form.district,
      password: form.password,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="city-admin-name">{t("name")}</Label>
        <Input
          id="city-admin-name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value.replace(/[^A-Za-z\s]/g, ""))}
          required
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name ? <p className="text-xs text-red-500">{errors.name}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city-admin-email">{t("email")}</Label>
        <Input
          id="city-admin-email"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          required
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email ? <p className="text-xs text-red-500">{errors.email}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city-admin-phone">{t("phone")}</Label>
        <div className="flex items-center rounded-md border">
          <span className="inline-flex h-9 items-center gap-2 border-r px-3 text-sm">
            <img
              src="https://flagcdn.com/w20/in.png"
              alt="India"
              className="h-3.5 w-5 rounded-[2px] object-cover"
            />
            +91
          </span>
          <Input
            id="city-admin-phone"
            value={form.phone}
            onChange={(e) =>
              updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            required
            inputMode="numeric"
            className={`border-0 shadow-none focus-visible:ring-0 ${errors.phone ? "text-red-600" : ""}`}
            placeholder={t("phonePlaceholder")}
          />
        </div>
        {errors.phone ? <p className="text-xs text-red-500">{errors.phone}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>{t("district")}</Label>
        <Select value={form.district} onValueChange={(value) => updateField("district", value)}>
          <SelectTrigger>
            <SelectValue placeholder={t("selectDistrict")} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {TAMIL_NADU_DISTRICTS.map((district) => (
              <SelectItem key={district} value={district}>
                {getDistrictLabel(district, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city-admin-password">{t("initialPassword")}</Label>
        <Input
          id="city-admin-password"
          type="password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          required
          minLength={8}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password ? (
          <p className="text-xs text-red-500">{errors.password}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("passwordGuidelines")}</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("adminIdAutoGenerated")}
      </p>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default CityAdminForm;

