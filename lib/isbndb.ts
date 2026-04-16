import type { NormalizedAuthor, NormalizedBook } from "@/lib/types"

const BASE_URL = "https://api2.isbndb.com"

// ─────────────────────────────────────────────
// Raw ISBNdb types
// ─────────────────────────────────────────────

interface ISBNdbBook {
  isbn: string
  isbn13?: string
  title: string
  title_long?: string
  authors?: string[]
  publisher?: string
  date_published?: string
  image?: string
  synopsis?: string
  pages?: number
  subjects?: string[]
  language?: string
}

interface ISBNdbBooksResponse {
  total: number
  books: ISBNdbBook[]
}

interface ISBNdbAuthorResponse {
  author: string
  books: ISBNdbBook[]
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function apiKey() {
  const key = process.env.ISBNDB_API_KEY
  if (!key) throw new Error("ISBNDB_API_KEY environment variable is not set")
  return key
}

function authHeaders() {
  return { Authorization: apiKey() }
}

/** Prefix ISBNdb ISBNs so they never collide with Google Books volume IDs. */
function isbndbId(book: ISBNdbBook) {
  return `isbndb:${book.isbn13 ?? book.isbn}`
}

function normalizeBook(book: ISBNdbBook): NormalizedBook {
  return {
    googleId: isbndbId(book),
    title: book.title ?? "Untitled",
    subtitle: book.title_long && book.title_long !== book.title
      ? book.title_long.replace(book.title, "").replace(/^[:\s]+/, "") || null
      : null,
    isbn: book.isbn13 ?? book.isbn ?? null,
    description: book.synopsis ?? null,
    pageCount: book.pages ?? null,
    imageUrl: book.image ?? null,
    publishedAt: book.date_published ?? null,
    publisher: book.publisher ?? null,
    language: book.language ?? null,
    categories: book.subjects?.slice(0, 3) ?? [],
    averageRating: null,
    ratingsCount: null,
    authorName: book.authors?.[0] ?? "Unknown Author",
  }
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/** Search books by title. */
export async function searchBooksByTitleISBN(
  query: string,
  options?: { maxResults?: number }
): Promise<NormalizedBook[]> {
  const pageSize = options?.maxResults ?? 20
  const qs = new URLSearchParams({ page: "1", pageSize: String(pageSize) })
  const res = await fetch(
    `${BASE_URL}/books/${encodeURIComponent(query)}?${qs}`,
    { headers: authHeaders(), next: { revalidate: 300 } }
  )
  if (!res.ok) {
    throw new Error(`ISBNdb API error: ${res.status} ${res.statusText}`)
  }
  const json: ISBNdbBooksResponse = await res.json()
  return (json.books ?? []).map(normalizeBook)
}

/**
 * Fetch all books for a specific author by name.
 * Returns a single NormalizedAuthor entry with all their found books.
 */
export async function searchAuthorISBN(
  authorName: string
): Promise<NormalizedAuthor[]> {
  const qs = new URLSearchParams({ page: "1", pageSize: "20" })
  const res = await fetch(
    `${BASE_URL}/author/${encodeURIComponent(authorName)}?${qs}`,
    { headers: authHeaders(), next: { revalidate: 300 } }
  )
  if (!res.ok) {
    throw new Error(`ISBNdb API error: ${res.status} ${res.statusText}`)
  }
  const json: ISBNdbAuthorResponse = await res.json()
  const books = (json.books ?? []).map(normalizeBook)

  if (books.length === 0) return []

  return [
    {
      name: json.author ?? authorName,
      bookCount: books.length,
      sampleBooks: books.slice(0, 5),
    },
  ]
}

/**
 * Search for authors matching a query.
 * ISBNdb has no dedicated author-list endpoint, so we search books and
 * aggregate results by author name — same pattern as Google Books.
 */
export async function searchAuthorsISBN(
  query: string
): Promise<NormalizedAuthor[]> {
  const qs = new URLSearchParams({ page: "1", pageSize: "40" })
  const res = await fetch(
    `${BASE_URL}/books/${encodeURIComponent(query)}?${qs}`,
    { headers: authHeaders(), next: { revalidate: 300 } }
  )
  if (!res.ok) {
    throw new Error(`ISBNdb API error: ${res.status} ${res.statusText}`)
  }
  const json: ISBNdbBooksResponse = await res.json()

  const authorMap = new Map<string, NormalizedBook[]>()

  for (const book of json.books ?? []) {
    const normalized = normalizeBook(book)
    const names = book.authors?.length ? book.authors : [normalized.authorName]

    for (const name of names) {
      const key = name.trim()
      if (!key) continue
      const existing = authorMap.get(key)
      if (existing) {
        existing.push(normalized)
      } else {
        authorMap.set(key, [normalized])
      }
    }
  }

  return Array.from(authorMap.entries())
    .map(([name, books]) => ({
      name,
      bookCount: books.length,
      sampleBooks: books.slice(0, 5),
    }))
    .sort((a, b) => b.bookCount - a.bookCount)
}
