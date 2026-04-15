import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/db"
import { addLocationSchema } from "@/lib/validations/books"

type Params = { params: Promise<{ id: string; locationId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id, locationId } = await params

  const body = await req.json()
  const parsed = addLocationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const location = await prisma.bookLocation.findFirst({
    where: {
      id: locationId,
      userBook: { id, userId: session.user.id },
    },
    select: { id: true },
  })

  if (!location) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.bookLocation.update({
    where: { id: locationId },
    data: parsed.data,
  })

  return Response.json({ data: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id, locationId } = await params

  const location = await prisma.bookLocation.findFirst({
    where: {
      id: locationId,
      userBook: { id, userId: session.user.id },
    },
    select: { id: true },
  })

  if (!location) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.bookLocation.delete({ where: { id: locationId } })
  return new Response(null, { status: 204 })
}
