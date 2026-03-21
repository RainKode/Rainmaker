"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword, type AuthActionState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

const INPUT_CLASS =
  "flex h-10 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-input focus:outline-none focus:ring-2 focus:ring-ring";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    forgotPassword,
    {}
  );

  if (state.success) {
    return (
      <AuthCard title="Check your email" description={state.success}>
        <Link href="/login">
          <Button variant="outline" className="w-full rounded-full h-10">
            Back to sign in
          </Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link"
    >
      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
            className={INPUT_CLASS}
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
          {pending ? "Sending\u2026" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-secondary hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
