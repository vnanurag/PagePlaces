import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/db"
import { updateUserBookSchema } from "@/lib/validations/books"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const userBook = await prisma.userBook.findFirst({
    where: { id, userId: session.user.id },
    include: {
      book: { include: { author: true } },
      locations: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!userBook) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({ data: userBook })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const body = await req.json()
  const parsed = updateUserBookSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const owned = await prisma.userBook.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })

  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.userBook.update({
    where: { id },
    data: parsed.data,
    include: {
      book: { include: { author: true } },
      locations: true,
    },
  })

  return Response.json({ data: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const owned = await prisma.userBook.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })

  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.userBook.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
