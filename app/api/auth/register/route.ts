import type { NextRequest } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/db"
import { signUpSchema } from "@/lib/validations/auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signUpSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { email, password, name } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: "Email already in use" }, { status: 409 })
    }

    const hashedPassword = await hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true, createdAt: true },
    })

    return Response.json({ data: user }, { status: 201 })
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
