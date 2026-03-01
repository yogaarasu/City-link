import { API_URL } from "@/utils/constants";
import axios from "axios";
import { getUserFromCookie } from "./user-session-cookie";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  try {
    const user = getUserFromCookie() as { _id?: string; role?: string } | null;
    if (!user) return config;
    const isValidObjectId = typeof user?._id === "string" && /^[a-fA-F0-9]{24}$/.test(user._id);
    if (isValidObjectId && user?.role) {
      config.headers["x-user-id"] = user._id;
      config.headers["x-user-role"] = user.role;
    }
  } catch {
    // ignore parse errors and continue request
  }

  return config;
});

