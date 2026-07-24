"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { organizationRepository } from "@/features/organizations/organization.repository";
import { normalizeApiError } from "@/lib/http-client";

export function ProfileSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const organization = useQuery({
    queryKey: ["organization", "profile", user?.role],
    queryFn: () => organizationRepository.get(user!),
    enabled: Boolean(user && user.role !== "ADMIN"),
  });
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
  });

  useEffect(() => {
    if (!organization.data) return;
    setForm({
      name: organization.data.name,
      address: organization.data.address,
      city: organization.data.city,
      phone: organization.data.phone,
    });
  }, [organization.data]);

  const updateOrganization = useMutation({
    mutationFn: () => organizationRepository.update(user!, form),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["organization", "profile", user?.role],
        updated
      );
      toast.success("Organization profile updated.");
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your sign-in identity is read-only. Organization contact details can be updated below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="firstName">First Name</label>
              <Input id="firstName" value={user?.firstName || ""} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lastName">Last Name</label>
              <Input id="lastName" value={user?.lastName || ""} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email Address</label>
            <Input id="email" type="email" value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="phone">Phone Number</label>
            <Input id="phone" value={user?.phone || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            {user?.role === "ADMIN"
              ? "Administrators do not belong to an external organization."
              : "Update the operational contact details stored for your organization."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.role === "ADMIN" ? (
            <p className="text-sm text-muted-foreground">
              No external organization profile is associated with this account.
            </p>
          ) : organization.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading organization profile...</p>
          ) : (
            <>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="orgName">Organization Name</label>
            <Input
              id="orgName"
              minLength={2}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="orgAddress">Address</label>
            <Input
              id="orgAddress"
              minLength={5}
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="orgCity">City</label>
              <Input
                id="orgCity"
                minLength={2}
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="orgPhone">Phone</label>
              <Input
                id="orgPhone"
                minLength={8}
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Status</label>
            <div className="text-sm font-medium">
              {organization.data?.status || user?.orgStatus || "N/A"}
            </div>
          </div>
          <Button
            disabled={
              updateOrganization.isPending ||
              form.name.trim().length < 2 ||
              form.address.trim().length < 5 ||
              form.city.trim().length < 2 ||
              form.phone.trim().length < 8
            }
            onClick={() => updateOrganization.mutate()}
          >
            {updateOrganization.isPending ? "Saving..." : "Save organization changes"}
          </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
