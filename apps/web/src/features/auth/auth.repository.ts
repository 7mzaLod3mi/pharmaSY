import { apiRequest } from "@/lib/http-client";
import type {
  AuthUser,
  LoginInput,
  LoginResponse,
  MessageResponse,
  RegisterInput,
} from "./auth.types";

export const authRepository = {
  login(input: LoginInput) {
    return apiRequest<LoginResponse>({ method: "POST", url: "/auth/login", data: input });
  },
  register(input: RegisterInput) {
    return apiRequest<MessageResponse>({ method: "POST", url: "/auth/register", data: input });
  },
  verifyEmail(email: string, otp: string) {
    return apiRequest<MessageResponse>({
      method: "POST",
      url: "/auth/verify-email",
      data: { email, otp },
    });
  },
  resendVerification(email: string) {
    return apiRequest<MessageResponse>({
      method: "POST",
      url: "/auth/resend-verification",
      data: { email },
    });
  },
  forgotPassword(email: string) {
    return apiRequest<MessageResponse>({
      method: "POST",
      url: "/auth/forgot-password",
      data: { email },
    });
  },
  resetPassword(token: string, newPassword: string) {
    return apiRequest<MessageResponse>({
      method: "POST",
      url: "/auth/reset-password",
      data: { token, newPassword },
    });
  },
  me() {
    return apiRequest<AuthUser>({ method: "GET", url: "/users/me" });
  },
  logout() {
    return apiRequest<{ success?: boolean; message?: string }>({
      method: "POST",
      url: "/auth/logout",
    });
  },
};
