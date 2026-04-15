import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/dal"
import { searchAuthors, searchBooksByAuthor } from "@/lib/google-books"

/**
 * GET /api/google-books/authors?q=tolkien
 *   → NormalizedAuthor[]  (author name + bookCount + sampleBooks)
 *
 * GET /api/google-books/authors?books=J.R.R.+Tolkien
 *   → NormalizedBook[]  (all books by that exact author)
 */
export async function GET(req: NextRequest) {
  await verifySession()

  const { searchParams } = req.nextUrl
  const q = searchParams.get("q")?.trim()
  const booksFor = searchParams.get("books")?.trim()

  if (!q && !booksFor) {
    return Response.json(
      { error: "Provide either 'q' (author search) or 'books' (books by author)" },
      { status: 400 }
    )
  }

  try {
    if (booksFor) {
      const maxResults = Number(searchParams.get("maxResults") ?? 20)
      const books = await searchBooksByAuthor(booksFor, {
        maxResults: isNaN(maxResults) ? 20 : maxResults,
      })
      return Response.json({ data: books })
    }

    const authors = await searchAuthors(q!)
    return Response.json({ data: authors })
  } catch {
    return Response.json(
      { error: "Failed to reach Google Books API" },
      { status: 502 }
    )
  }
}
