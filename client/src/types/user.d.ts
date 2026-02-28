export type UserRole = "citizen" | "city_admin" | "super_admin";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  district: string;
  role: UserRole;
  adminAccess?: "active" | "inactive" | "start" | "stop";
  lastLoginAt?: string | null;
  isVerified: boolean;
  avatar?: string;
}
