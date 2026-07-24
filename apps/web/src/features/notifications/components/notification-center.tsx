"use client";

import { useState } from "react";
import { ClipboardList, Boxes, Recycle, Megaphone, CheckCheck, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks/use-notifications";
import type { NotificationType } from "@/features/notifications/api/notifications.types";

const typeIcon: Record<NotificationType, typeof ClipboardList> = {
  order: ClipboardList,
  inventory: Boxes,
  exchange: Recycle,
  system: Megaphone,
  admin: Megaphone,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationCenter() {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const { data: notifications, isLoading } = useNotifications({ unreadOnly: tab === "unread" });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
          <CheckCheck className="size-4" /> Mark all read
        </Button>
      </div>

      <div className="divide-y divide-border">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5">
              <Skeleton className="h-5 w-full" />
            </div>
          ))}

        {!isLoading && notifications?.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Inbox className="size-6 text-muted-foreground/60" />
            <p className="text-[13.5px] text-muted-foreground">Nothing here yet.</p>
          </div>
        )}

        {!isLoading &&
          notifications?.map((n) => {
            const Icon = typeIcon[n.type];
            return (
              <div
                key={n.id}
                className={cn(
                  "flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors duration-200 hover:bg-black/[0.015]",
                  !n.isRead && "bg-brand-50/30"
                )}
                onClick={() => !n.isRead && markRead.mutate(n.id)}
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13.5px] font-medium text-foreground">{n.title}</p>
                    {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-brand-600" />}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{n.message}</p>
                  <p className="mt-1.5 text-[11.5px] text-muted-foreground/70">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
      </div>
    </Card>
  );
}
