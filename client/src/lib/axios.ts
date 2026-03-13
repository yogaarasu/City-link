import { API_URL } from "@/utils/constants";
import axios from "axios";
import { clearAuthSessionCookie } from "./user-session-cookie";
import { useUserState } from "@/store/user.store";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSessionCookie();
      useUserState.getState().clearUser();
    }
    return Promise.reject(error);
  }
);

