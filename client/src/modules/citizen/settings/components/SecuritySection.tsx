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

export const SecuritySection = () => {
  const user = useUserState((state) => state.user);
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
        toast.error(error.response?.data?.error ?? "Failed to update password");
        return;
      }
      toast.error("Failed to update password");
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
        toast.error(error.response?.data?.error ?? "Failed to send OTP");
        return;
      }
      toast.error("Failed to send OTP");
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
        toast.error(error.response?.data?.error ?? "Invalid OTP");
        return;
      }
      toast.error("Invalid OTP");
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
        toast.error(error.response?.data?.error ?? "Failed to reset password");
        return;
      }
      toast.error("Failed to reset password");
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Security</CardTitle>
        <p className="text-muted-foreground text-sm">Manage your password and security settings.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="inline-flex rounded-lg border p-1">
          <Button variant={mode === "change" ? "secondary" : "ghost"} onClick={() => setMode("change")}>
            Change Password
          </Button>
          <Button variant={mode === "forgot" ? "secondary" : "ghost"} onClick={() => setMode("forgot")}>
            Forgot Password (OTP)
          </Button>
        </div>

        {mode === "change" ? (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters with mixed letter cases and numbers.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpdatePassword} disabled={isSubmitting}>
                Update Password
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3 rounded-lg border p-4">
            {forgotStep === "email" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleRequestOTP} disabled={isForgotLoading}>
                    Send OTP
                  </Button>
                </div>
              </>
            )}

            {forgotStep === "otp" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input value={forgotOTP} onChange={(event) => setForgotOTP(event.target.value)} />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setForgotStep("email")}>
                    Change Email
                  </Button>
                  <Button onClick={handleVerifyOTP} disabled={isForgotLoading}>
                    Verify OTP
                  </Button>
                </div>
              </>
            )}

            {forgotStep === "reset" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(event) => setForgotNewPassword(event.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleResetPassword} disabled={isForgotLoading}>
                    Reset Password
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
