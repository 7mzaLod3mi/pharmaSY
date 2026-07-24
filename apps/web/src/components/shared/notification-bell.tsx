"use client";

import Link from "next/link";
import { Bell, ClipboardList, Boxes, Recycle, Megaphone, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications/hooks/use-notifications";
import type { NotificationType } from "@/features/notifications/api/notifications.types";
import { cn } from "@/lib/utils";

const typeIcon: Record<NotificationType, typeof Bell> = {
  order: ClipboardList,
  inventory: Boxes,
  exchange: Recycle,
  system: Megaphone,
  admin: Megaphone,
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell({ notificationsHref }: { notificationsHref: string }) {
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const recent = notifications?.slice(0, 5) ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-border-strong text-foreground/70 transition-colors duration-200 hover:bg-black/[0.03] focus:outline-none">
        <Bell className="size-4" />
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute end-1.5 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-danger-500 text-[9px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-[13px] font-semibold">Notifications</p>
          {!!unreadCount && unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-600 transition-colors duration-200 hover:text-brand-700"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {recent.length === 0 && (
            <p className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">You&apos;re all caught up.</p>
          )}
          {recent.map((n) => {
            const Icon = typeIcon[n.type];
            return (
              <div
                key={n.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-black/[0.02]",
                  !n.isRead && "bg-brand-50/40"
                )}
                onClick={() => !n.isRead && markRead.mutate(n.id)}
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug text-foreground">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600" />}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
            <Link href={notificationsHref}>View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
