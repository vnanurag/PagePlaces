import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/db"
import { createUserBookSchema } from "@/lib/validations/books"

export async function GET() {
  const session = await verifySession()

  const userBooks = await prisma.userBook.findMany({
    where: { userId: session.user.id },
    include: {
      book: { include: { author: true } },
      locations: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ data: userBooks })
}

export async function POST(req: NextRequest) {
  const session = await verifySession()

  try {
    const body = await req.json()
    const parsed = createUserBookSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const {
      googleId,
      title,
      subtitle,
      isbn,
      description,
      pageCount,
      imageUrl,
      publishedAt,
      authorName,
      authorGoogleId,
      notes,
      rating,
    } = parsed.data

    // 1. Resolve author — prefer match by googleId, fall back to name
    let author = authorGoogleId
      ? await prisma.author.findUnique({ where: { googleId: authorGoogleId } })
      : await prisma.author.findFirst({ where: { name: authorName } })

    if (!author) {
      author = await prisma.author.create({
        data: { name: authorName, googleId: authorGoogleId ?? null },
      })
    }

    // 2. Resolve book — prefer googleId, fall back to isbn, then create
    let book = googleId
      ? await prisma.book.findUnique({ where: { googleId } })
      : isbn
        ? await prisma.book.findUnique({ where: { isbn } })
        : null

    if (!book) {
      book = await prisma.book.create({
        data: {
          googleId: googleId ?? null,
          title,
          subtitle: subtitle ?? null,
          isbn: isbn ?? null,
          description: description ?? null,
          pageCount: pageCount ?? null,
          imageUrl: imageUrl ?? null,
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          authorId: author.id,
        },
      })
    }

    // 3. Upsert userBook — idempotent add to collection
    const userBook = await prisma.userBook.upsert({
      where: { userId_bookId: { userId: session.user.id, bookId: book.id } },
      update: {
        ...(notes !== undefined && { notes }),
        ...(rating !== undefined && { rating }),
      },
      create: {
        userId: session.user.id,
        bookId: book.id,
        notes: notes ?? null,
        rating: rating ?? null,
      },
      include: {
        book: { include: { author: true } },
        locations: true,
      },
    })

    return Response.json({ data: userBook }, { status: 201 })
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
