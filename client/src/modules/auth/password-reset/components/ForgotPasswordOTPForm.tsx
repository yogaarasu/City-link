import { useEffect, useState, type ComponentProps, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { verifyPasswordResetSchema } from "../validation/password-reset.schema";

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
      toast.error("Missing email. Start again.");
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    const parseResult = verifyPasswordResetSchema.safeParse({ otp });
    if (!parseResult.success) {
      toast.error(parseResult.error.issues[0]?.message ?? "Invalid OTP");
      return;
    }

    try {
      setIsVerifying(true);
      const response = await verifyPasswordResetOTP(email, otp);
      toast.success(response.data.message);
      navigate(`/auth/forgot-password/reset?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Invalid OTP");
        return;
      }
      toast.error("Invalid OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email. Start again.");
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
        toast.error(error.response?.data?.error ?? "Unable to resend OTP");
        return;
      }
      toast.error("Unable to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleVerify}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Verify OTP</h1>
            <FieldDescription>
              Enter the code sent to <b className="text-primary">{email}</b>
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="otp" className="sr-only">
              OTP
            </FieldLabel>

            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              id="otp"
              required
              containerClassName="gap-4"
              disabled={isVerifying}
            >
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-13 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-13 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <FieldDescription className="text-center">
              {seconds > 0 ? (
                <>Resend OTP in {seconds}s</>
              ) : (
                <Button
                  variant="link"
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-semibold text-sky-600"
                >
                  Resend OTP
                </Button>
              )}
            </FieldDescription>
          </Field>

          <Field>
            <Button
              type="submit"
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying" : "Verify OTP"}
              {isVerifying && <Loader className="animate-spin" />}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            Wrong email?{" "}
            <Link to="/auth/forgot-password" className="text-emerald-500 hover:underline">
              Try another email
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
