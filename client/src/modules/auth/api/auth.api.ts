import { api } from "@/lib/axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export const login = (payload: LoginPayload) => api.post("/auth/login", payload);

