import type { IUser } from "@/types/user";
import { create } from "zustand";
import {
  clearAuthSessionCookie,
  getUserFromCookie,
  setAuthSessionCookie,
  setUserCookie,
} from "@/lib/user-session-cookie";
import { logout } from "@/modules/auth/api/auth.api";

interface UserState {
  user: IUser | null;
  setUser: (user: IUser) => void;
  setAuthSession: (user: IUser) => void;
  updateUser: (payload: Partial<IUser>) => void;
  clearUser: () => void;
}

export const useUserState = create<UserState>((set) => ({
  user: getUserFromCookie(),
  setUser: (user) => {
    setUserCookie(user);
    set({ user });
  },
  setAuthSession: (user) => {
    setAuthSessionCookie(user);
    set({ user });
  },
  updateUser: (payload) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...payload };
      setUserCookie(updated);
      return { user: updated };
    }),
  clearUser: () => {
    void logout();
    clearAuthSessionCookie();
    set({ user: null });
  },
}));

