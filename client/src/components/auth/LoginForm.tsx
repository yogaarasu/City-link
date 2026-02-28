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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const setUser = useUserState((state) => state.setUser);
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
      setEmailError("Please enter a valid email address");
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
      setUser(user);
      toast.success(res.data.message ?? "Login successful");
      navigateByRole(user.role);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Unable to login");
        return;
      }
      toast.error("Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Welcome Back.</h1>
            <FieldDescription>
              Don&apos;t have an account? <Link to="/auth/signup" replace viewTransition>Sign up</Link>
            </FieldDescription>
          </div>
          <Separator />
          <FieldDescription className="text-center">
            The official civic engagement platform connecting citizens across all 38 districts with their local administration.
          </FieldDescription>
          
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={handleEmailChange}
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && <span className="text-xs text-red-500">{emailError}</span>}
          </Field>
          
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                to="/auth/forgot-password"
                className="text-xs text-emerald-500 hover:underline"
                viewTransition
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                required
                className="pr-10"
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
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in" : "Login"}
              {isSubmitting && <Loader className="animate-spin" />}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
