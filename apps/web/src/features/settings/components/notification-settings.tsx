"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, normalizeApiError } from "@/lib/http-client";
import { toast } from "sonner";
import { Mail, Smartphone } from "lucide-react";

interface NotificationPreferences {
  orders: boolean;
  marketplace: boolean;
  inventory: boolean;
  pharmacyExchange: boolean;
  productRequests: boolean;
  adminApproval: boolean;
  system: boolean;
  marketing: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  digestFrequency: "NONE" | "DAILY" | "WEEKLY";
}

const defaults: NotificationPreferences = {
  orders: true,
  marketplace: true,
  inventory: true,
  pharmacyExchange: false,
  productRequests: true,
  adminApproval: true,
  system: true,
  marketing: false,
  emailEnabled: true,
  inAppEnabled: true,
  pushEnabled: true,
  digestFrequency: "NONE",
};

export function NotificationSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () =>
      apiRequest<NotificationPreferences>({
        method: "GET",
        url: "/notifications/preferences",
      }),
  });

  const updatePrefs = useMutation({
    mutationFn: (payload: Partial<NotificationPreferences>) =>
      apiRequest<NotificationPreferences>({
        method: "PATCH",
        url: "/notifications/preferences",
        data: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "preferences"] });
      toast.success("Preferences saved successfully");
    },
    onError: (error) => {
      toast.error(normalizeApiError(error).message);
    }
  });

  const preferences = data ?? defaults;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Choose how you want to receive alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-4">
              <Mail className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive daily digests and urgent alerts via email.</p>
              </div>
            </div>
            <input type="checkbox" className="w-5 h-5 cursor-pointer accent-brand-600" checked={preferences.emailEnabled} onChange={(e) => updatePrefs.mutate({ emailEnabled: e.target.checked })} disabled={isLoading || updatePrefs.isPending} />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-start gap-3">
              <Smartphone className="size-5 mt-0.5 text-muted-foreground" />
              <div>
                <h4 className="text-sm font-medium leading-none mb-1">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive browser push notifications when active.</p>
              </div>
            </div>
            <input type="checkbox" className="w-5 h-5 cursor-pointer accent-brand-600" checked={preferences.pushEnabled} onChange={(e) => updatePrefs.mutate({ pushEnabled: e.target.checked })} disabled={isLoading || updatePrefs.isPending} />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div>
              <h4 className="mb-1 text-sm font-medium leading-none">In-app notifications</h4>
              <p className="text-sm text-muted-foreground">Show alerts inside PharmaSY.</p>
            </div>
            <input
              checked={preferences.inAppEnabled}
              className="h-5 w-5 cursor-pointer accent-brand-600"
              disabled={isLoading || updatePrefs.isPending}
              type="checkbox"
              onChange={(event) =>
                updatePrefs.mutate({ inAppEnabled: event.target.checked })
              }
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Activity Preferences</CardTitle>
          <CardDescription>Choose which events you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div>
              <h4 className="text-sm font-medium leading-none mb-1">Order Updates</h4>
              <p className="text-sm text-muted-foreground">Status changes on orders you placed or received.</p>
            </div>
            <input type="checkbox" className="w-5 h-5 cursor-pointer accent-brand-600" checked={preferences.orders} onChange={(e) => updatePrefs.mutate({ orders: e.target.checked })} disabled={isLoading || updatePrefs.isPending} />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div>
              <h4 className="text-sm font-medium leading-none mb-1">Low Stock Alerts</h4>
              <p className="text-sm text-muted-foreground">When inventory items fall below minimum threshold.</p>
            </div>
            <input type="checkbox" className="w-5 h-5 cursor-pointer accent-brand-600" checked={preferences.inventory} onChange={(e) => updatePrefs.mutate({ inventory: e.target.checked })} disabled={isLoading || updatePrefs.isPending} />
          </div>

          {(
            [
              ["marketplace", "Marketplace activity"],
              ["productRequests", "Product request decisions"],
              ["adminApproval", "Organization approval"],
              ["system", "System messages"],
              ["marketing", "Product news and marketing"],
            ] as const
          ).map(([key, label]) => (
            <div className="flex items-center justify-between gap-4" key={key}>
              <span className="text-sm font-medium">{label}</span>
              <input
                checked={preferences[key]}
                className="h-5 w-5 cursor-pointer accent-brand-600"
                disabled={isLoading || updatePrefs.isPending}
                type="checkbox"
                onChange={(event) =>
                  updatePrefs.mutate({ [key]: event.target.checked })
                }
              />
            </div>
          ))}

          <label className="flex items-center justify-between gap-4 text-sm font-medium">
            Email digest
            <select
              className="h-9 rounded-full border border-border bg-background px-3 text-sm"
              disabled={isLoading || updatePrefs.isPending}
              value={preferences.digestFrequency}
              onChange={(event) =>
                updatePrefs.mutate({
                  digestFrequency: event.target
                    .value as NotificationPreferences["digestFrequency"],
                })
              }
            >
              <option value="NONE">None</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
