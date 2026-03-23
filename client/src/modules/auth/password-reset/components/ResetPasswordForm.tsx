import { useMemo, useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { updatePassword } from "../api/password-reset.api";
import { useI18n } from "@/modules/i18n/useI18n";
import { buildPasswordSchema } from "@/modules/auth/validation/password.schema";

export function ResetPasswordForm({
  className,
  ...props
}: ComponentProps<"div">) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { t, language } = useI18n();

  const updatePasswordSchema = useMemo(
    () =>
      z
        .object({
          newPassword: buildPasswordSchema(t),
          confirmPassword: z.string().min(1, t("authConfirmPasswordRequired")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("authPasswordsNoMatch"),
          path: ["confirmPassword"],
        }),
    [t, language]
  );

  type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async ({ newPassword }: UpdatePasswordValues) => {
    if (!email) {
      toast.error(t("authMissingEmailResetFlow"));
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await updatePassword(email, newPassword);
      toast.success(response.data.message);
      navigate("/auth/login", { replace: true });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("authUnableToUpdatePassword"));
        return;
      }
      toast.error(t("authUnableToUpdatePassword"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">{t("authResetPasswordTitle")}</h1>
            <FieldDescription className="text-base">
              {t("authResetPasswordSubtitle")} <b className="text-primary">{email}</b>
            </FieldDescription>
          </div>
          <Separator />

          <Field>
            <FieldLabel htmlFor="newPassword" className="text-base">{t("authNewPasswordLabel")}</FieldLabel>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder={t("authNewPasswordPlaceholder")}
                className={cn("h-10 pr-10 text-base", errors.newPassword && "border-red-500")}
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <span className="text-xs text-red-500">{errors.newPassword.message}</span>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword" className="text-base">{t("authConfirmPasswordLabel")}</FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("authConfirmNewPasswordPlaceholder")}
                className={cn("h-10 pr-10 text-base", errors.confirmPassword && "border-red-500")}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>
            )}
          </Field>

          <Field>
            <Button
              type="submit"
              className="h-10 w-full bg-emerald-500 hover:bg-emerald-600 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("authUpdating") : t("authUpdatePassword")}
              {isSubmitting && <Loader className="animate-spin" />}
            </Button>
          </Field>

          <FieldDescription className="text-center text-base">
            <Link to="/auth/login" className="text-emerald-500 hover:underline">
              {t("authBackToLogin")}
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}

