import type { NextRequest } from "next/server"
import { searchAuthorISBN, searchBooksByTitleISBN } from "@/lib/isbndb"

/**
 * GET /api/isbndb?mode=author&q=Alamkrutha+Gamini  → NormalizedAuthor[]
 * GET /api/isbndb?mode=title&q=Between+Sips        → NormalizedBook[]
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q")?.trim()
  const mode = searchParams.get("mode") ?? "author"

  if (!q) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  if (!process.env.ISBNDB_API_KEY) {
    return Response.json(
      { error: "ISBNdb API key is not configured. Add ISBNDB_API_KEY to your environment variables." },
      { status: 503 }
    )
  }

  try {
    if (mode === "author") {
      const authors = await searchAuthorISBN(q)
      return Response.json({ data: authors })
    }

    const maxResults = Number(searchParams.get("maxResults") ?? 20)
    const books = await searchBooksByTitleISBN(q, {
      maxResults: isNaN(maxResults) ? 20 : maxResults,
    })
    return Response.json({ data: books })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: `ISBNdb request failed: ${message}` }, { status: 502 })
  }
}
