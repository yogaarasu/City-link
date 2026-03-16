import { useEffect, useMemo, useState, type ComponentProps, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as z from "zod";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
} from "../api/password-reset.api";
import { useI18n } from "@/modules/i18n/useI18n";

export function ForgotPasswordOTPForm({
  className,
  ...props
}: ComponentProps<"div">) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { t, language } = useI18n();

  const verifyPasswordResetSchema = useMemo(
    () =>
      z.object({
        otp: z.string().regex(/^\d{6}$/, t("authOtpSixDigits")),
      }),
    [t, language]
  );

  useEffect(() => {
    if (!email) {
      navigate("/auth/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((current) => current - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    if (!email) {
      toast.error(t("authMissingEmailStartAgain"));
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    const parseResult = verifyPasswordResetSchema.safeParse({ otp });
    if (!parseResult.success) {
      toast.error(parseResult.error.issues[0]?.message ?? t("authInvalidOtp"));
      return;
    }

    try {
      setIsVerifying(true);
      const response = await verifyPasswordResetOTP(email, otp);
      toast.success(response.data.message);
      navigate(`/auth/forgot-password/reset?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("authInvalidOtp"));
        return;
      }
      toast.error(t("authInvalidOtp"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error(t("authMissingEmailStartAgain"));
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    try {
      setIsResending(true);
      const response = await requestPasswordResetOTP(email);
      toast.success(response.data.message);
      setSeconds(60);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("authUnableToResendOtp"));
        return;
      }
      toast.error(t("authUnableToResendOtp"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      <form onSubmit={handleVerify}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">{t("authVerifyOtpTitle")}</h1>
            <FieldDescription className="text-base">
              {t("authOtpEmailSubtitle")} <b className="text-primary">{email}</b>
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              {t("authOtpLabel")}
            </FieldLabel>

            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              id="otp"
              required
              containerClassName="gap-4 justify-center"
              disabled={isVerifying}
              
            >
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <FieldDescription className="text-center text-base">
              {seconds > 0 ? (
                <>{t("authResendOtpIn", { seconds })}</>
              ) : (
                <Button
                  variant="link"
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-semibold text-emerald-500 hover:text-emerald-600"
                >
                  {t("authResendOtp")}
                </Button>
              )}
            </FieldDescription>
          </Field>

          <Field>
            <Button
              type="submit"
              className="h-10 w-full bg-emerald-500 hover:bg-emerald-600 text-base"
              disabled={isVerifying}
            >
              {isVerifying ? t("authVerifying") : t("authVerifyOtp")}
              {isVerifying && <Loader className="animate-spin" />}
            </Button>
          </Field>

          <FieldDescription className="text-center text-base">
            {t("authWrongEmail")}{" "}
            <Link to="/auth/forgot-password" className="text-emerald-500 hover:underline">
              {t("authTryAnotherEmail")}
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}

