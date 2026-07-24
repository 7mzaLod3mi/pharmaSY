"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/http-client";
import { toast } from "sonner";
import { BellRing, Mail, Smartphone } from "lucide-react";

export function NotificationSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/notifications/preferences");
      return res.data;
    },
  });

  const updatePrefs = useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.patch("/notifications/preferences", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", "preferences"] });
      toast.success("Preferences saved successfully");
    },
    onError: () => {
      toast.error("Failed to save preferences");
    }
  });

  const preferences = data?.data || {
    emailNotifications: true,
    pushNotifications: false,
    orderUpdates: true,
    inventoryAlerts: true,
    marketing: false,
  };

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
            <input type="checkbox" className="w-5 h-5 cursor-pointer accent-brand-600" checked={preferences.emailNotifications} onChange={(e) => updatePrefs.mutate({ emailNotifications: e.target.checked })} disabled={isLoading || updatePrefs.isPending} />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-start gap-3">
              <Smartphone className="size-5 mt-0.5 text-muted-foreground" />
              <div>
                <h4 className="text-sm font-medium leading-none mb-1">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive browser push notifications when active.</p>
              </div>
            </div>
            <input type="checkbox" className="w-5 h-5 cursor-pointer accent-brand-600" checked={preferences.pushNotifications} onChange={(e) => updatePrefs.mutate({ pushNotifications: e.target.checked })} disabled={isLoading || updatePrefs.isPending} />
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
            <input type="checkbox" className="w-5 h-5 cursor-pointer accent-brand-600" checked={preferences.orderUpdates} onChange={(e) => updatePrefs.mutate({ orderUpdates: e.target.checked })} disabled={isLoading || updatePrefs.isPending} />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div>
              <h4 className="text-sm font-medium leading-none mb-1">Low Stock Alerts</h4>
              <p className="text-sm text-muted-foreground">When inventory items fall below minimum threshold.</p>
            </div>
            <input type="checkbox" className="w-5 h-5 cursor-pointer accent-brand-600" checked={preferences.lowStock} onChange={(e) => updatePrefs.mutate({ lowStock: e.target.checked })} disabled={isLoading || updatePrefs.isPending} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
