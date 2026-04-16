import type { NextRequest } from "next/server"
import { searchAuthorsOL, searchBooksOL } from "@/lib/open-library"

/**
 * GET /api/open-library?mode=author&q=tolkien  → NormalizedAuthor[]
 * GET /api/open-library?mode=title&q=dune      → NormalizedBook[]
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q")?.trim()
  const mode = searchParams.get("mode") ?? "author"

  if (!q) {
    return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  try {
    if (mode === "author") {
      const authors = await searchAuthorsOL(q)
      return Response.json({ data: authors })
    }

    const maxResults = Number(searchParams.get("maxResults") ?? 20)
    const books = await searchBooksOL(q, {
      maxResults: isNaN(maxResults) ? 20 : maxResults,
    })
    return Response.json({ data: books })
  } catch {
    return Response.json({ error: "Failed to reach Open Library API" }, { status: 502 })
  }
}
