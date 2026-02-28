import { useState, type ComponentProps } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader } from "lucide-react";
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
import { requestPasswordResetSchema } from "../validation/password-reset.schema";
import type { RequestPasswordResetValues } from "../validation/password-reset.schema";

export function ForgotPasswordEmailForm({
  className,
  ...props
}: ComponentProps<"div">) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        toast.error(error.response?.data?.error ?? "Unable to send OTP");
        return;
      }
      toast.error("Unable to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Forgot Password?</h1>
            <FieldDescription className="text-base">
              Enter your email and we will send a 6-digit OTP.
            </FieldDescription>
          </div>
          <Separator />
          <Field>
            <FieldLabel htmlFor="email" className="text-base">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
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
              className="h-10 w-full bg-[#129141] text-white hover:bg-[#0f7c38] text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending OTP" : "Send OTP"}
              {isSubmitting && <Loader className="animate-spin" />}
            </Button>
          </Field>

          <FieldDescription className="text-center text-base">
            Remember your password?{" "}
            <Link to="/auth/login" className="text-[#129141] hover:underline">
              Back to login
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
