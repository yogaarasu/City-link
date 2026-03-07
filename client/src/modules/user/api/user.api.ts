import { api } from "@/lib/axios";
import type { IUser } from "@/types/user";

export const getMe = async () => {
  const response = await api.get<{ user: IUser }>("/user/me");
  return response.data.user;
};

export const updateProfile = async (payload: { name: string; avatar: string }) => {
  const response = await api.patch<{ message: string; user: IUser }>("/user/profile", payload);
  return response.data;
};

export const changePassword = async (payload: { currentPassword: string; newPassword: string }) => {
  const response = await api.post<{ message: string }>("/user/change-password", payload);
  return response.data;
};

export const deleteAccount = async (payload: { password: string }) => {
  const response = await api.delete<{ message: string }>("/user/account", { data: payload });
  return response.data;
};

