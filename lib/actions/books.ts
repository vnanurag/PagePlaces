"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { searchBooks } from "@/lib/google-books"
import type { NormalizedBook } from "@/lib/types"
import { AUTHOR_NAME } from "@/lib/constants"

export type SaveBookResult =
  | { success: true; userBookId: string }
  | { success: false; error: string }

export type SyncResult =
  | { success: true; added: number }
  | { success: false; error: string }

function parsePublishedAt(value: string | null): Date | null {
  if (!value) return null
  const normalized = /^\d{4}$/.test(value) ? `${value}-01-01` : value
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

async function saveBookCore(book: NormalizedBook): Promise<string> {
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

  return userBook.id
}

export async function saveBookAction(book: NormalizedBook): Promise<SaveBookResult> {
  try {
    const userBookId = await saveBookCore(book)
    revalidatePath("/library")
    revalidatePath("/dashboard")
    return { success: true, userBookId }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[saveBookAction]", msg)
    return { success: false, error: msg }
  }
}

export async function syncAuthorBooksAction(): Promise<SyncResult> {
  try {
    // Broad all-fields query so we surface books even if the Google Books
    // author metadata is incomplete or formatted differently.
    const books = await searchBooks(AUTHOR_NAME, {
      maxResults: 40,
      printType: "books",
      orderBy: "newest",
    })

    // Only save books where the author name clearly matches the target author.
    const authorBooks = books.filter((b) => {
      const n = b.authorName.toLowerCase()
      return n.includes("gamini") || n.includes("alamkrutha")
    })

    let added = 0
    for (const book of authorBooks) {
      try {
        await saveBookCore(book)
        added++
      } catch {
        // Skip individual failures (e.g. duplicate key on isbn)
      }
    }

    revalidatePath("/library")
    revalidatePath("/dashboard")
    return { success: true, added }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[syncAuthorBooksAction]", msg)
    return { success: false, error: msg }
  }
}
