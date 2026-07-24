"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authRepository } from "@/features/auth/auth.repository";
import { normalizeApiError } from "@/lib/http-client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      const response = await authRepository.resetPassword(
        String(form.get("token") ?? ""),
        String(form.get("newPassword") ?? "")
      );
      setMessage(response.message);
    } catch (unknownError) {
      setError(normalizeApiError(unknownError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Use the one-time reset token from your email.">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" name="token" required defaultValue={searchParams.get("token") ?? ""} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        {message ? <p role="status" className="text-sm text-success-500">{message}</p> : null}
        {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : null}
        <Button disabled={submitting} type="submit" className="w-full">Reset password</Button>
      </form>
      {message ? <p className="mt-6 text-center text-sm"><Link className="text-brand-600 hover:underline" href="/login">Continue to log in</Link></p> : null}
    </AuthLayout>
  );
}
