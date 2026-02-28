import type { IUser } from "@/types/user";
import { create } from "zustand";
import {
  clearUserCookie,
  getUserFromCookie,
  setUserCookie,
} from "@/lib/user-session-cookie";

interface UserState {
  user: IUser | null;
  setUser: (user: IUser) => void;
  updateUser: (payload: Partial<IUser>) => void;
  clearUser: () => void;
}

export const useUserState = create<UserState>((set) => ({
  user: getUserFromCookie(),
  setUser: (user) => {
    setUserCookie(user);
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
    clearUserCookie();
    set({ user: null });
  },
}));
