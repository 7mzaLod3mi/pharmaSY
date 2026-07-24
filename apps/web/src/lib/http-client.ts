import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: `${apiOrigin}/api/v1`,
  timeout: 30_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface ApiEnvelope<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success?: false;
  statusCode?: number;
  message?: string | string[];
  code?: string;
  accountState?: string;
  reason?: string;
  errors?: Record<string, string[]>;
  path?: string;
}

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly path?: string;
  readonly accountState?: string;
  readonly reason?: string;

  constructor(options: {
    status: number | null;
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    path?: string;
    accountState?: string;
    reason?: string;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
    this.path = options.path;
    this.accountState = options.accountState;
    this.reason = options.reason;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
const sessionExpiredListeners = new Set<() => void>();

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function onSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired() {
  setAccessToken(null);
  sessionExpiredListeners.forEach((listener) => listener());
}

export function unwrapData<T>(response: { data: ApiEnvelope<T> | T }): T {
  const body = response.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiFailure>;
    const payload = axiosError.response?.data;
    const rawMessage = payload?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage ?? axiosError.message;

    return new ApiError({
      status: axiosError.response?.status ?? null,
      code:
        payload?.code ??
        (axiosError.code === "ERR_NETWORK"
          ? "network_error"
          : `http_${axiosError.response?.status ?? "unknown"}`),
      message,
      fieldErrors: payload?.errors,
      path: payload?.path,
      accountState: payload?.accountState,
      reason: payload?.reason,
    });
  }
  return new ApiError({
    status: null,
    code: "unknown_error",
    message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
  });
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiEnvelope<{ accessToken: string; expiresIn: number }>>(
        `${apiOrigin}/api/v1/auth/refresh`,
        undefined,
        { withCredentials: true, timeout: 30_000 }
      )
      .then((response) => {
        const data = unwrapData(response);
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _authRetry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiFailure>) => {
    const config = error.config as RetriableConfig | undefined;
    const path = config?.url ?? "";
    const isAuthBootstrap =
      path.includes("/auth/login") ||
      path.includes("/auth/register") ||
      path.includes("/auth/refresh");

    if (error.response?.status === 401 && config && !config._authRetry && !isAuthBootstrap) {
      config._authRetry = true;
      try {
        const token = await refreshAccessToken();
        config.headers.set("Authorization", `Bearer ${token}`);
        return apiClient.request(config);
      } catch (refreshError) {
        notifySessionExpired();
        return Promise.reject(normalizeApiError(refreshError));
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiEnvelope<T> | T>(config);
  return unwrapData(response);
}

export async function bootstrapSession(): Promise<boolean> {
  try {
    await refreshAccessToken();
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}
