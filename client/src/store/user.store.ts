import type { IUser } from "@/types/user";
import { create } from "zustand";
import {
  clearAuthSessionCookie,
  getUserFromCookie,
  setAuthSessionCookie,
  setUserCookie,
} from "@/lib/user-session-cookie";

interface UserState {
  user: IUser | null;
  setUser: (user: IUser) => void;
  setAuthSession: (user: IUser, token: string) => void;
  updateUser: (payload: Partial<IUser>) => void;
  clearUser: () => void;
}

export const useUserState = create<UserState>((set) => ({
  user: getUserFromCookie(),
  setUser: (user) => {
    setUserCookie(user);
    set({ user });
  },
  setAuthSession: (user, token) => {
    setAuthSessionCookie(user, token);
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
    clearAuthSessionCookie();
    set({ user: null });
  },
}));

