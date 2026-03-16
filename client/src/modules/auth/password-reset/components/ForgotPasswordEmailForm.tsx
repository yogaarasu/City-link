import { useMemo, useState, type ComponentProps } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader } from "lucide-react";
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
import { requestPasswordResetOTP } from "../api/password-reset.api";
import { useI18n } from "@/modules/i18n/useI18n";

export function ForgotPasswordEmailForm({
  className,
  ...props
}: ComponentProps<"div">) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, language } = useI18n();

  const requestPasswordResetSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("authInvalidEmail")),
      }),
    [t, language]
  );

  type RequestPasswordResetValues = z.infer<typeof requestPasswordResetSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetValues>({
    resolver: zodResolver(requestPasswordResetSchema),
  });

  const onSubmit = async ({ email }: RequestPasswordResetValues) => {
    try {
      setIsSubmitting(true);
      const response = await requestPasswordResetOTP(email);
      toast.success(response.data.message);
      navigate(`/auth/forgot-password/verify?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("authUnableToSendOtp"));
        return;
      }
      toast.error(t("authUnableToSendOtp"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">{t("authForgotTitle")}</h1>
            <FieldDescription className="text-base">
              {t("authForgotSubtitle")}
            </FieldDescription>
          </div>
          <Separator />
          <Field>
            <FieldLabel htmlFor="email" className="text-base">{t("email")}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={t("authEmailPlaceholder")}
              className={cn("h-10 text-base", errors.email ? "border-red-500" : "")}
              {...register("email")}
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </Field>

          <Field>
            <Button
              type="submit"
              className="h-10 w-full bg-emerald-500 hover:bg-emerald-600 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("authSendingOtp") : t("authSendOtp")}
              {isSubmitting && <Loader className="animate-spin" />}
            </Button>
          </Field>

          <FieldDescription className="text-center text-base">
            {t("authRememberPassword")}{" "}
            <Link to="/auth/login" className="text-emerald-500 hover:underline">
              {t("authBackToLogin")}
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}

