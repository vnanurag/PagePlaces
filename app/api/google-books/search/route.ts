import type { NextRequest } from "next/server"
import { searchBooks } from "@/lib/google-books"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q")?.trim()
  if (!q) {
    return Response.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    )
  }

  const maxResults = Number(searchParams.get("maxResults") ?? 20)
  const orderBy = searchParams.get("orderBy") as "relevance" | "newest" | null

  try {
    const books = await searchBooks(q, {
      maxResults: isNaN(maxResults) ? 20 : maxResults,
      orderBy: orderBy ?? undefined,
    })
    return Response.json({ data: books })
  } catch {
    return Response.json(
      { error: "Failed to reach Google Books API" },
      { status: 502 }
    )
  }
}
