"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/db"
import { signInSchema, signUpSchema } from "@/lib/validations/auth"

export type FormState = {
  formError?: string
  fieldErrors?: Partial<Record<string, string[]>>
} | null

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<Record<string, string[]>>,
    }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        formError:
          error.type === "CredentialsSignin"
            ? "Invalid email or password."
            : "Something went wrong. Please try again.",
      }
    }
    throw error
  }

  return null
}

export async function registerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const nameValue = formData.get("name")
  const parsed = signUpSchema.safeParse({
    name:
      typeof nameValue === "string" && nameValue.trim()
        ? nameValue.trim()
        : undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<Record<string, string[]>>,
    }
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { formError: "An account with this email already exists." }
  }

  try {
    const hashedPassword = await hash(password, 12)
    await prisma.user.create({
      data: { email, password: hashedPassword, name },
    })
  } catch {
    return { formError: "Failed to create account. Please try again." }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { formError: "Account created. Please sign in." }
    }
    throw error
  }

  return null
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}
