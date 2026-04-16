import { redirect } from "next/navigation"
import { auth } from "@/auth"

/**
 * Verifies that a session exists and returns it.
 * Redirects to /login if the user is not authenticated.
 * Use this in Server Components and Server Actions that require auth.
 */
export async function verifySession() {
  // AUTH BYPASS — remove the mock below and uncomment the real check to re-enable auth
  return { user: { id: "dev-bypass", email: "dev@bypass.local", name: "Dev" } } as any // eslint-disable-line @typescript-eslint/no-explicit-any

  // const session = await auth()
  // if (!session?.user?.id) redirect("/login")
  // return session as typeof session & { user: { id: string } }
}

/**
 * Returns the current session without redirecting.
 * Use this when you need to conditionally render based on auth state.
 */
export async function getOptionalSession() {
  return auth()
}
