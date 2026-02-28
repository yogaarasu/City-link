import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "@/types/user";
import { useUserState } from "@/store/user.store";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const user = useUserState((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
