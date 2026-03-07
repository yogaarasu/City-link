import { useCallback, useEffect, useState } from "react";
import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { getAuthTokenFromCookie } from "@/lib/user-session-cookie";
import { getMe } from "@/modules/user/api/user.api";
import { useUserState } from "@/store/user.store";
import type { IUser } from "@/types/user";

export const AuthLayout = () => {
  const navigate = useNavigate();
  const token = getAuthTokenFromCookie();
  const user = useUserState((state) => state.user);
  const setUser = useUserState((state) => state.setUser);
  const clearUser = useUserState((state) => state.clearUser);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(token && !user));

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
    let isCancelled = false;

    const redirectIfAuthenticated = async () => {
      if (!token) {
        setIsCheckingSession(false);
        return;
      }

      if (user) {
        navigateByRole(user.role);
        return;
      }

      try {
        setIsCheckingSession(true);
        const me = await getMe();
        if (isCancelled) return;
        setUser(me);
        navigateByRole(me.role);
      } catch {
        if (isCancelled) return;
        clearUser();
        setIsCheckingSession(false);
      }
    };

    void redirectIfAuthenticated();
    return () => {
      isCancelled = true;
    };
  }, [clearUser, navigateByRole, setUser, token, user]);

  if (token && (user || isCheckingSession)) {
    return (
      <div className="bg-background flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading...
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
            className="h-11 w-11"
            onClick={() => navigate("/")}
          >
            <ArrowLeft strokeWidth={3} className="h-6 w-6" />
          </Button>
          <h1 className="bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            CityLink
          </h1>
        </div>
        <ThemeToggler />
      </header>
      <Outlet />
    </>
  );
};
