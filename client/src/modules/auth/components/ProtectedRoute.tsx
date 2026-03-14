import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "@/types/user";
import { useUserState } from "@/store/user.store";
import { getMe } from "@/modules/user/api/user.api";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const user = useUserState((state) => state.user);
  const setUser = useUserState((state) => state.setUser);
  const clearUser = useUserState((state) => state.clearUser);
  const location = useLocation();
  const [isHydratingUser, setIsHydratingUser] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const hydrateUser = async () => {
      try {
        setIsHydratingUser(true);
        const me = await getMe();
        if (!isCancelled) {
          setUser(me);
        }
      } catch {
        if (!isCancelled) {
          clearUser();
        }
      } finally {
        if (!isCancelled) {
          setIsHydratingUser(false);
        }
      }
    };

    void hydrateUser();
    return () => {
      isCancelled = true;
    };
  }, [clearUser, setUser]);

  if (!user && isHydratingUser) {
    return <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

