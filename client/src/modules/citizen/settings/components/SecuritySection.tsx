import { useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/modules/user/api/user.api";
import {
  requestPasswordResetOTP,
  updatePassword,
  verifyPasswordResetOTP,
} from "@/modules/auth/password-reset/api/password-reset.api";
import { useUserState } from "@/store/user.store";
import { useI18n } from "@/modules/i18n/useI18n";

export const SecuritySection = () => {
  const user = useUserState((state) => state.user);
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"change" | "forgot">("change");

  const [forgotEmail, setForgotEmail] = useState(user?.email ?? "");
  const [forgotOTP, setForgotOTP] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">("email");
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleUpdatePassword = async () => {
    try {
      setIsSubmitting(true);
      const response = await changePassword({ currentPassword, newPassword });
      toast.success(response.message);
      setCurrentPassword("");
      setNewPassword("");
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

  const handleRequestOTP = async () => {
    try {
      setIsForgotLoading(true);
      const response = await requestPasswordResetOTP(forgotEmail);
      toast.success(response.data.message);
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

  const handleVerifyOTP = async () => {
    try {
      setIsForgotLoading(true);
      const response = await verifyPasswordResetOTP(forgotEmail, forgotOTP);
      toast.success(response.data.message);
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

  const handleResetPassword = async () => {
    try {
      setIsForgotLoading(true);
      const response = await updatePassword(forgotEmail, forgotNewPassword);
      toast.success(response.data.message);
      setForgotOTP("");
      setForgotNewPassword("");
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
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("currentPassword")}</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("newPassword")}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("passwordGuidelines")}
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpdatePassword} disabled={isSubmitting}>
                {t("updatePassword")}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3 rounded-lg border p-4">
            {forgotStep === "email" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("email")}</label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleRequestOTP} disabled={isForgotLoading}>
                    {t("authSendOtp")}
                  </Button>
                </div>
              </>
            )}

            {forgotStep === "otp" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("enterOtp")}</label>
                  <Input value={forgotOTP} onChange={(event) => setForgotOTP(event.target.value)} />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setForgotStep("email")}>
                    {t("changeEmail")}
                  </Button>
                  <Button onClick={handleVerifyOTP} disabled={isForgotLoading}>
                    {t("authVerifyOtp")}
                  </Button>
                </div>
              </>
            )}

            {forgotStep === "reset" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("newPassword")}</label>
                  <Input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(event) => setForgotNewPassword(event.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleResetPassword} disabled={isForgotLoading}>
                    {t("resetPassword")}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

