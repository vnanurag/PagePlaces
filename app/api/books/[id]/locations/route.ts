import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/db"
import { addLocationSchema } from "@/lib/validations/books"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const owned = await prisma.userBook.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })

  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const locations = await prisma.bookLocation.findMany({
    where: { userBookId: id },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ data: locations })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const body = await req.json()
  const parsed = addLocationSchema.safeParse(body)
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

  const location = await prisma.bookLocation.create({
    data: { ...parsed.data, userBookId: id },
  })

  return Response.json({ data: location }, { status: 201 })
}
