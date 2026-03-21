"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type AuthActionState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    resetPassword,
    {}
  );

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your new password below"
    >
      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            New password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            placeholder="Min 8 chars, mixed case + number"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
          />
        </div>

        {state.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full rounded-full h-10"
          disabled={pending}
        >
          {pending ? "Updating\u2026" : "Update password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="text-secondary hover:underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
