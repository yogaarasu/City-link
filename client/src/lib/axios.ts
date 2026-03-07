import { API_URL } from "@/utils/constants";
import axios from "axios";
import { clearAuthSessionCookie, getAuthTokenFromCookie } from "./user-session-cookie";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = getAuthTokenFromCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSessionCookie();
    }
    return Promise.reject(error);
  }
);

