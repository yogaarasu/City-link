import React, { useState } from "react"
import { Eye, EyeOff, Loader } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from "react-router-dom"
import { Separator } from "../ui/separator"
import { login } from "@/modules/auth/api/auth.api"
import { AxiosError } from "axios"
import { toast } from "sonner"
import { useUserState } from "@/store/user.store"
import type { IUser } from "@/types/user"
import { useI18n } from "@/modules/i18n/useI18n"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const setAuthSession = useUserState((state) => state.setAuthSession);
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val && !emailRegex.test(val)) {
      setEmailError(t("authInvalidEmail"));
    } else {
      setEmailError("");
    }
  };

  const navigateByRole = (role: IUser["role"]) => {
    if (role === "citizen") {
      navigate("/citizen/dashboard", { replace: true });
      return;
    }

    if (role === "city_admin") {
      navigate("/city-admin/dashboard", { replace: true });
      return;
    }

    navigate("/super-admin/dashboard", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) return;

    try {
      setIsSubmitting(true);
      const res = await login({ email, password });
      const user = res.data.user as IUser;
      setAuthSession(user);
      toast.success(res.data.message ?? t("authLoginSuccess"));
      navigateByRole(user.role);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("authLoginFailed"));
        return;
      }
      toast.error(t("authLoginFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">{t("authLoginTitle")}</h1>
            <FieldDescription className="text-base">
              {t("authLoginSubtitle")}{" "}
              <Link to="/auth/signup" replace className="text-emerald-500 hover:underline" viewTransition>
                {t("authSignUp")}
              </Link>
            </FieldDescription>
          </div>
          <Separator />
          <FieldDescription className="text-center text-base">
            {t("authPlatformDescription")}
          </FieldDescription>
          
          <Field>
            <FieldLabel htmlFor="email" className="text-base">{t("email")}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={t("authEmailPlaceholder")}
              required
              value={email}
              onChange={handleEmailChange}
              className={cn("h-10 text-base", emailError ? "border-red-500" : "")}
            />
            {emailError && <span className="text-xs text-red-500">{emailError}</span>}
          </Field>
          
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password" className="text-base">{t("authPasswordLabel")}</FieldLabel>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-emerald-500 hover:underline"
                viewTransition
              >
                {t("authForgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("authPasswordPlaceholder")}
                required
                className="h-10 pr-10 text-base"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          
          <Field>
            <Button
              type="submit"
              className="h-10 w-full  bg-emerald-500 hover:bg-emerald-600 text-white text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("authLoggingIn") : t("authLogin")}
              {isSubmitting && <Loader className="animate-spin" />}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-base">
        {t("authAgreeTermsPrefix")}{" "}
        <a href="#" className="underline hover:text-[#129141]">{t("authTerms")}</a>{" "}
        {t("authAnd")}{" "}
        <a href="#" className="underline hover:text-[#129141]">{t("authPrivacy")}</a>
        {t("authAgreeTermsSuffix")}
      </FieldDescription>
    </div>
  )
}

