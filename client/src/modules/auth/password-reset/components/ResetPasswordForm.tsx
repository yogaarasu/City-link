import { useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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
import { updatePasswordSchema } from "../validation/password-reset.schema";
import type { UpdatePasswordValues } from "../validation/password-reset.schema";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async ({ newPassword }: UpdatePasswordValues) => {
    if (!email) {
      toast.error("Missing email. Start the reset flow again.");
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
        toast.error(error.response?.data?.error ?? "Unable to update password");
        return;
      }
      toast.error("Unable to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Reset Password</h1>
            <FieldDescription>
              Set a new password for <b className="text-primary">{email}</b>
            </FieldDescription>
          </div>
          <Separator />

          <Field>
            <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                className={cn("pr-10", errors.newPassword && "border-red-500")}
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
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                className={cn("pr-10", errors.confirmPassword && "border-red-500")}
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
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating" : "Update Password"}
              {isSubmitting && <Loader className="animate-spin" />}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            <Link to="/auth/login" className="text-emerald-500 hover:underline">
              Back to login
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
