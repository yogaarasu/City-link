import { useCallback, useEffect, useState } from "react";
import { ThemeToggler } from "@/components/ThemeToggler";
import { LanguageToggler } from "@/components/LanguageToggler";
import { useI18n } from "@/modules/i18n/useI18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { useUserState } from "@/store/user.store";
import type { IUser } from "@/types/user";

export const AuthLayout = () => {
  const navigate = useNavigate();
  const user = useUserState((state) => state.user);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(user));
  const { t } = useI18n();

  const navigateByRole = useCallback((role: IUser["role"]) => {
    if (role === "citizen") {
      navigate("/citizen/dashboard", { replace: true });
      return;
    }

    if (role === "city_admin") {
      navigate("/city-admin/dashboard", { replace: true });
      return;
    }

    navigate("/super-admin/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      navigateByRole(user.role);
      return;
    }
    setIsCheckingSession(false);
  }, [navigateByRole, user]);

  if (user || isCheckingSession) {
    return (
      <div className="bg-background flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  return (
    <>
      <header className="sticky z-20 top-0 p-3 flex justify-between backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9"
            onClick={() => navigate("/")}
          >
            <ArrowLeft strokeWidth={3} className="h-6 w-6" />
          </Button>
          <h1 className="bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            CityLink
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggler />
          <ThemeToggler />
        </div>
      </header>
      <Outlet />
    </>
  );
};
