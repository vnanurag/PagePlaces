"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { loginAction } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          PagePlaces
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <form action={formAction} className="space-y-4">
          {state?.formError && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {state.formError}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              placeholder="you@example.com"
            />
            {state?.fieldErrors?.email?.[0] && (
              <p role="alert" className="text-xs text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              placeholder="••••••••"
            />
            {state?.fieldErrors?.password?.[0] && (
              <p role="alert" className="text-xs text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
