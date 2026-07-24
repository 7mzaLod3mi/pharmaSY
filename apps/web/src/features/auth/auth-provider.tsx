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
      const response = await authRepository.login(input);
      setAccessToken(response.accessToken);
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

  const logout = useCallback(async () => {
    try {
      if (state === "authenticated") await authRepository.logout();
    } finally {
      becomeAnonymous();
    }
  }, [becomeAnonymous, state]);

  const value = useMemo<AuthContextValue>(
    () => ({ state, user, error, login, register, logout, refreshProfile }),
    [state, user, error, login, register, logout, refreshProfile]
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
