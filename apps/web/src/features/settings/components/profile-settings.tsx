"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileSettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            View your personal details. Updating details is currently not supported by the backend.
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
              : "Organization updates require administrative review."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="orgName">Organization Name</label>
            <Input id="orgName" value={user?.orgName || "N/A"} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Status</label>
            <div className="text-sm font-medium">{user?.orgStatus || "N/A"}</div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button disabled>Save Changes</Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        Note: The backend profile update API (PATCH) is currently incomplete. This form is a read-only preview.
      </p>
    </div>
  );
}
