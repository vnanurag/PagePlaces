"use server"

import { prisma } from "@/lib/db"
import type { NormalizedBook } from "@/lib/types"

export type SaveBookResult =
  | { success: true; userBookId: string }
  | { success: false; error: string }

function parsePublishedAt(value: string | null): Date | null {
  if (!value) return null
  const normalized = /^\d{4}$/.test(value) ? `${value}-01-01` : value
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

export async function saveBookAction(book: NormalizedBook): Promise<SaveBookResult> {
  try {
    // 1. Resolve or create author by name
    let author = await prisma.author.findFirst({
      where: { name: book.authorName },
    })
    if (!author) {
      author = await prisma.author.create({
        data: { name: book.authorName },
      })
    }

    // 2. Resolve or create book (prefer googleId, fall back to isbn)
    let dbBook = book.googleId
      ? await prisma.book.findUnique({ where: { googleId: book.googleId } })
      : book.isbn
        ? await prisma.book.findUnique({ where: { isbn: book.isbn } })
        : null

    if (!dbBook) {
      dbBook = await prisma.book.create({
        data: {
          googleId: book.googleId,
          title: book.title,
          subtitle: book.subtitle,
          isbn: book.isbn,
          description: book.description,
          pageCount: book.pageCount,
          imageUrl: book.imageUrl,
          publishedAt: parsePublishedAt(book.publishedAt),
          authorId: author.id,
        },
      })
    }

    // 3. Upsert userBook — idempotent, bookId is globally unique
    const userBook = await prisma.userBook.upsert({
      where: { bookId: dbBook.id },
      update: {},
      create: { bookId: dbBook.id },
      select: { id: true },
    })

    return { success: true, userBookId: userBook.id }
  } catch (e) {
    console.error("[saveBookAction]", e)
    return { success: false, error: "Failed to save book. Please try again." }
  }
}
