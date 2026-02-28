import { api } from "@/lib/axios";

export const requestPasswordResetOTP = (email: string) => {
  return api
    .post("/auth/password-reset/request-otp", { email })
    .catch((error) => {
      if (error?.response?.status === 404) {
        return api.post("/auth/forgot-password/request-otp", { email });
      }
      throw error;
    });
};

export const verifyPasswordResetOTP = (email: string, otp: string) => {
  return api
    .post("/auth/password-reset/verify-otp", { email, otp })
    .catch((error) => {
      if (error?.response?.status === 404) {
        return api.post("/auth/forgot-password/verify-otp", { email, otp });
      }
      throw error;
    });
};

export const updatePassword = (email: string, newPassword: string) => {
  return api
    .post("/auth/password-reset/update", { email, newPassword })
    .catch((error) => {
      if (error?.response?.status === 404) {
        return api.post("/auth/forgot-password/update", { email, newPassword });
      }
      throw error;
    });
};
