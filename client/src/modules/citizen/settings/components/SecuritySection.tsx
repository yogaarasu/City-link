import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { changePassword } from "@/modules/user/api/user.api";
import {
  requestPasswordResetOTP,
  updatePassword,
  verifyPasswordResetOTP,
} from "@/modules/auth/password-reset/api/password-reset.api";
import { buildPasswordSchema } from "@/modules/auth/validation/password.schema";
import { useUserState } from "@/store/user.store";
import { useI18n } from "@/modules/i18n/useI18n";

export const SecuritySection = () => {
  const user = useUserState((state) => state.user);
  const { t, language } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"change" | "forgot">("change");

  const [forgotEmail, setForgotEmail] = useState(user?.email ?? "");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">("email");
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const changePasswordSchema = useMemo(
    () =>
      z.object({
        currentPassword: z.string().min(1, t("enterPasswordToContinue")),
        newPassword: buildPasswordSchema(t),
      }),
    [t, language]
  );
  const forgotEmailSchema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email(t("authInvalidEmail")),
      }),
    [t, language]
  );
  const forgotOtpSchema = useMemo(
    () =>
      z.object({
        otp: z.string().regex(/^\d{6}$/, t("authOtpSixDigits")),
      }),
    [t, language]
  );
  const forgotResetSchema = useMemo(
    () =>
      z.object({
        newPassword: buildPasswordSchema(t),
      }),
    [t, language]
  );

  type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
  type ForgotEmailValues = z.infer<typeof forgotEmailSchema>;
  type ForgotOtpValues = z.infer<typeof forgotOtpSchema>;
  type ForgotResetValues = z.infer<typeof forgotResetSchema>;

  const changePasswordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });
  const forgotEmailForm = useForm<ForgotEmailValues>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email: user?.email ?? "" },
  });
  const forgotOtpForm = useForm<ForgotOtpValues>({
    resolver: zodResolver(forgotOtpSchema),
    defaultValues: { otp: "" },
  });
  const forgotResetForm = useForm<ForgotResetValues>({
    resolver: zodResolver(forgotResetSchema),
    defaultValues: { newPassword: "" },
  });

  const handleUpdatePassword = async (values: ChangePasswordValues) => {
    try {
      setIsSubmitting(true);
      const response = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success(response.message);
      changePasswordForm.reset();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("errorUpdatePassword"));
        return;
      }
      toast.error(t("errorUpdatePassword"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOTP = async (values: ForgotEmailValues) => {
    try {
      setIsForgotLoading(true);
      const response = await requestPasswordResetOTP(values.email);
      toast.success(response.data.message);
      setForgotEmail(values.email);
      setForgotStep("otp");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("errorSendOtp"));
        return;
      }
      toast.error(t("errorSendOtp"));
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleVerifyOTP = async (values: ForgotOtpValues) => {
    try {
      setIsForgotLoading(true);
      const response = await verifyPasswordResetOTP(forgotEmail, values.otp);
      toast.success(response.data.message);
      forgotOtpForm.reset();
      setForgotStep("reset");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("authInvalidOtp"));
        return;
      }
      toast.error(t("authInvalidOtp"));
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (values: ForgotResetValues) => {
    try {
      setIsForgotLoading(true);
      const response = await updatePassword(forgotEmail, values.newPassword);
      toast.success(response.data.message);
      forgotResetForm.reset();
      setForgotStep("email");
      setMode("change");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("errorResetPassword"));
        return;
      }
      toast.error(t("errorResetPassword"));
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t("security")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("securitySubtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="inline-flex rounded-lg border p-1">
          <Button variant={mode === "change" ? "secondary" : "ghost"} onClick={() => setMode("change")}>
            {t("changePassword")}
          </Button>
          <Button variant={mode === "forgot" ? "secondary" : "ghost"} onClick={() => setMode("forgot")}>
            {t("forgotPasswordOtp")}
          </Button>
        </div>

        {mode === "change" ? (
          <form
            className="space-y-4"
            onSubmit={changePasswordForm.handleSubmit(handleUpdatePassword)}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("currentPassword")}</label>
              <Input
                type="password"
                {...changePasswordForm.register("currentPassword")}
                className={cn(
                  changePasswordForm.formState.errors.currentPassword ? "border-red-500" : ""
                )}
              />
              {changePasswordForm.formState.errors.currentPassword && (
                <p className="text-xs text-red-500">
                  {changePasswordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("newPassword")}</label>
              <Input
                type="password"
                {...changePasswordForm.register("newPassword")}
                className={cn(
                  changePasswordForm.formState.errors.newPassword ? "border-red-500" : ""
                )}
              />
              {changePasswordForm.formState.errors.newPassword ? (
                <p className="text-xs text-red-500">
                  {changePasswordForm.formState.errors.newPassword.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("passwordGuidelines")}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {t("updatePassword")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 rounded-lg border p-4">
            {forgotStep === "email" && (
              <form
                className="space-y-3"
                onSubmit={forgotEmailForm.handleSubmit(handleRequestOTP)}
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("email")}</label>
                  <Input
                    type="email"
                    {...forgotEmailForm.register("email")}
                    className={cn(
                      forgotEmailForm.formState.errors.email ? "border-red-500" : ""
                    )}
                  />
                  {forgotEmailForm.formState.errors.email && (
                    <p className="text-xs text-red-500">
                      {forgotEmailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isForgotLoading}>
                    {t("authSendOtp")}
                  </Button>
                </div>
              </form>
            )}

            {forgotStep === "otp" && (
              <form
                className="space-y-3"
                onSubmit={forgotOtpForm.handleSubmit(handleVerifyOTP)}
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("enterOtp")}</label>
                  <Input
                    {...forgotOtpForm.register("otp")}
                    className={cn(
                      forgotOtpForm.formState.errors.otp ? "border-red-500" : ""
                    )}
                  />
                  {forgotOtpForm.formState.errors.otp && (
                    <p className="text-xs text-red-500">
                      {forgotOtpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => setForgotStep("email")}>
                    {t("changeEmail")}
                  </Button>
                  <Button type="submit" disabled={isForgotLoading}>
                    {t("authVerifyOtp")}
                  </Button>
                </div>
              </form>
            )}

            {forgotStep === "reset" && (
              <form
                className="space-y-3"
                onSubmit={forgotResetForm.handleSubmit(handleResetPassword)}
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("newPassword")}</label>
                  <Input
                    type="password"
                    {...forgotResetForm.register("newPassword")}
                    className={cn(
                      forgotResetForm.formState.errors.newPassword ? "border-red-500" : ""
                    )}
                  />
                  {forgotResetForm.formState.errors.newPassword ? (
                    <p className="text-xs text-red-500">
                      {forgotResetForm.formState.errors.newPassword.message}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("passwordGuidelines")}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isForgotLoading}>
                    {t("resetPassword")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

