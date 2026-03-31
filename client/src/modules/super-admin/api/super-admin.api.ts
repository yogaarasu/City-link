import { api } from "@/lib/axios";
import type {
  CityAdmin,
  CityAdminDetailsResponse,
  CityAdminPayload,
  CityIssueDetail,
  SystemOverview,
} from "../types/super-admin.types";

interface ListCityAdminsParams {
  district?: string;
  search?: string;
}

export const getSystemOverview = async () => {
  const response = await api.get<{ overview: SystemOverview }>("/super-admin/overview");
  return response.data.overview;
};

export const getCityIssueDetails = async (district: string) => {
  const response = await api.get<{ details: CityIssueDetail }>(
    `/super-admin/cities/${encodeURIComponent(district)}`
  );
  return response.data.details;
};

export const listCityAdmins = async (params: ListCityAdminsParams) => {
  const response = await api.get<{ admins: CityAdmin[] }>("/super-admin/city-admins", {
    params,
  });
  return response.data.admins;
};

export const checkCityAdminEmailAvailability = async (email: string, excludeAdminId?: string) => {
  const response = await api.get<{
    available: boolean;
    existingRole: string | null;
    existingDeleted: boolean;
  }>("/super-admin/city-admins/email-availability", {
    params: {
      email,
      excludeAdminId,
    },
  });
  return response.data;
};

export const createCityAdmin = async (payload: CityAdminPayload) => {
  const response = await api.post<{ message: string; admin: CityAdmin }>(
    "/super-admin/city-admins",
    payload
  );
  return response.data;
};

export const getCityAdminDetails = async (adminId: string) => {
  const response = await api.get<{ details: CityAdminDetailsResponse }>(
    `/super-admin/city-admins/${adminId}`
  );
  return response.data.details;
};

export const updateCityAdmin = async (adminId: string, payload: CityAdminPayload) => {
  const response = await api.patch<{ message: string; admin: CityAdmin }>(
    `/super-admin/city-admins/${adminId}`,
    payload
  );
  return response.data;
};

export const updateCityAdminName = async (adminId: string, name: string) => {
  const response = await api.patch<{ message: string; admin: CityAdmin }>(
    `/super-admin/city-admins/${adminId}/name`,
    { name }
  );
  return response.data;
};

export const deleteCityAdmin = async (adminId: string) => {
  const response = await api.delete<{ message: string }>(`/super-admin/city-admins/${adminId}`);
  return response.data;
};

