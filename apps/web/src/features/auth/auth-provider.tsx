"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  bootstrapSession,
  normalizeApiError,
  onSessionExpired,
  setAccessToken,
  type ApiError,
} from "@/lib/http-client";
import { authRepository } from "./auth.repository";
import type { AuthUser, LoginInput, RegisterInput } from "./auth.types";

type AuthState = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  state: AuthState;
  user: AuthUser | null;
  error: ApiError | null;
  login(input: LoginInput): Promise<AuthUser>;
  register(input: RegisterInput): ReturnType<typeof authRepository.register>;
  verifyEmail(email: string, otp: string): Promise<AuthUser | null>;
  resendVerification(email: string): ReturnType<typeof authRepository.resendVerification>;
  logout(): Promise<void>;
  refreshProfile(): Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const becomeAnonymous = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setState("anonymous");
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authRepository.me();
      setUser(profile);
      setState("authenticated");
      setError(null);
      return profile;
    } catch (unknownError) {
      const apiError = normalizeApiError(unknownError);
      setError(apiError);
      if (apiError.status === 401) becomeAnonymous();
      return null;
    }
  }, [becomeAnonymous]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onSessionExpired(becomeAnonymous);

    void (async () => {
      const restored = await bootstrapSession();
      if (!active) return;
      if (!restored) {
        becomeAnonymous();
        return;
      }
      await refreshProfile();
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [becomeAnonymous, refreshProfile]);

  const login = useCallback(async (input: LoginInput) => {
    try {
      const data = await authRepository.login(input);
      setAccessToken(data.accessToken);
      const profile = await authRepository.me();
      setUser(profile);
      setState("authenticated");
      setError(null);
      return profile;
    } catch (unknownError) {
      const apiError = normalizeApiError(unknownError);
      setError(apiError);
      throw apiError;
    }
  }, []);

  const register = useCallback((input: RegisterInput) => authRepository.register(input), []);

  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      try {
        const response = await authRepository.verifyEmail(email, otp);
        if (response.accessToken) {
          setAccessToken(response.accessToken);
          if (response.user) {
            setUser(response.user);
            setState("authenticated");
            setError(null);
            return response.user;
          }
        }
        return refreshProfile();
      } catch (unknownError) {
        const apiError = normalizeApiError(unknownError);
        setError(apiError);
        throw apiError;
      }
    },
    [refreshProfile]
  );

  const resendVerification = useCallback(
    (email: string) => authRepository.resendVerification(email),
    []
  );

  const logout = useCallback(async () => {
    try {
      if (state === "authenticated") await authRepository.logout();
    } finally {
      becomeAnonymous();
    }
  }, [becomeAnonymous, state]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user,
      error,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      refreshProfile,
    }),
    [state, user, error, login, register, verifyEmail, resendVerification, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function dashboardPathForRole(role: AuthUser["role"]) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "SUPPLIER") return "/supplier/dashboard";
  return "/pharmacy/dashboard";
}

export function getOnboardingRedirectPath(user: AuthUser) {
  if (user.role === "ADMIN") return "/admin/dashboard";
  if (!user.emailVerifiedAt || user.accountState === "EMAIL_NOT_VERIFIED") {
    return `/verify-email?email=${encodeURIComponent(user.email)}`;
  }
  const orgStatus = user.orgStatus ?? user.pharmacy?.status ?? user.supplier?.status;
  if (!user.orgId && !user.pharmacy && !user.supplier) {
    return "/onboarding";
  }
  if (orgStatus === "REJECTED" || user.accountState === "ORGANIZATION_REJECTED") {
    return "/onboarding";
  }
  if (orgStatus === "PENDING" || user.accountState === "ORGANIZATION_PENDING") {
    return "/";
  }
  return dashboardPathForRole(user.role);
}
