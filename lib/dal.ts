import { redirect } from "next/navigation"
import { auth } from "@/auth"

/**
 * Verifies that a session exists and returns it.
 * Redirects to /login if the user is not authenticated.
 * Use this in Server Components and Server Actions that require auth.
 */
export async function verifySession() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session as typeof session & { user: { id: string } }
}

/**
 * Returns the current session without redirecting.
 * Use this when you need to conditionally render based on auth state.
 */
export async function getOptionalSession() {
  return auth()
}
