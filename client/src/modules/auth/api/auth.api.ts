import { api } from "@/lib/axios";
import type { IUser } from "@/types/user";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  message: string;
  user: IUser;
  token: string;
}

export const login = (payload: LoginPayload) => api.post<AuthSuccessResponse>("/auth/login", payload);

