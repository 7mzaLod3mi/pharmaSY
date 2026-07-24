"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { useAuth } from "@/features/auth/auth-provider";
import { getAccessToken } from "@/lib/http-client";
import { notificationsQueryKeys } from "../api/notifications.query-keys";

export function RealtimeNotifications() {
  const { state } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state !== "authenticated") return;
    const origin = (process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
      .replace(/\/+$/, "");
    const seen = new Set<string>();
    const socket = io(origin, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: { token: getAccessToken() },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    });

    const refreshNotifications = (payload: unknown) => {
      const id =
        payload && typeof payload === "object" && "id" in payload
          ? String((payload as { id: unknown }).id)
          : "";
      if (id && seen.has(id)) return;
      if (id) {
        seen.add(id);
        if (seen.size > 500) seen.delete(seen.values().next().value ?? "");
      }
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all });
    };

    socket.io.on("reconnect_attempt", () => {
      socket.auth = { token: getAccessToken() };
    });
    socket.on("notification:new", refreshNotifications);
    socket.on("notification:updated", refreshNotifications);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [queryClient, state]);

  return null;
}
