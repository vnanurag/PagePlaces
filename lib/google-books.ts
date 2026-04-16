import type {
  GoogleBooksSearchResponse,
  GoogleBooksVolume,
  NormalizedAuthor,
  NormalizedBook,
} from "@/lib/types"

const BASE_URL = "https://www.googleapis.com/books/v1"

// ─────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────

export type SearchOptions = {
  /** Number of results (1–40). Defaults to 20. */
  maxResults?: number
  /** Sort order. Defaults to "relevance". */
  orderBy?: "relevance" | "newest"
  /** Restrict to a specific print type. */
  printType?: "all" | "books" | "magazines"
  /** BCP 47 language code to restrict results (e.g. "en"). */
  langRestrict?: string
}

// ─────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────

function buildParams(query: string, options: SearchOptions = {}): URLSearchParams {
  const { maxResults = 20, orderBy, printType, langRestrict } = options
  const params = new URLSearchParams({
    q: query,
    maxResults: String(Math.min(Math.max(maxResults, 1), 40)),
  })
  if (orderBy) params.set("orderBy", orderBy)
  if (printType) params.set("printType", printType)
  if (langRestrict) params.set("langRestrict", langRestrict)
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY)
  }
  return params
}

async function fetchVolumes(
  query: string,
  options: SearchOptions = {}
): Promise<GoogleBooksVolume[]> {
  const params = buildParams(query, options)
  const res = await fetch(`${BASE_URL}/volumes?${params}`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status} ${res.statusText}`)
  }
  const json: GoogleBooksSearchResponse = await res.json()
  return json.items ?? []
}

// ─────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────

/** Convert a raw Google Books volume into the app's internal NormalizedBook.
 *  Every optional field is coerced to `null` — never left as `undefined`. */
export function normalizeVolume(volume: GoogleBooksVolume): NormalizedBook {
  const { id: googleId, volumeInfo: v } = volume

  const isbn =
    v.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ??
    v.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier ??
    null

  const rawThumbnail =
    v.imageLinks?.thumbnail ??
    v.imageLinks?.smallThumbnail ??
    null

  return {
    googleId,
    title: v.title ?? "Untitled",
    subtitle: v.subtitle ?? null,
    isbn,
    description: v.description ?? null,
    pageCount: v.pageCount ?? null,
    imageUrl: rawThumbnail ? rawThumbnail.replace(/^http:\/\//, "https://") : null,
    publishedAt: v.publishedDate ?? null,
    publisher: v.publisher ?? null,
    language: v.language ?? null,
    categories: v.categories ?? [],
    averageRating: v.averageRating ?? null,
    ratingsCount: v.ratingsCount ?? null,
    authorName: v.authors?.[0] ?? "Unknown Author",
  }
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Generic full-text book search.
 *
 * @example
 * const books = await searchBooks("the lord of the rings")
 */
export async function searchBooks(
  query: string,
  options?: SearchOptions
): Promise<NormalizedBook[]> {
  const volumes = await fetchVolumes(query, options)
  return volumes.map(normalizeVolume)
}

/**
 * Search for books by a specific author name.
 * Uses Google Books `inauthor:` filter for precision.
 *
 * @example
 * const books = await searchBooksByAuthor("J.R.R. Tolkien")
 */
export async function searchBooksByAuthor(
  authorName: string,
  options?: SearchOptions
): Promise<NormalizedBook[]> {
  const volumes = await fetchVolumes(`inauthor:${authorName}`, {
    printType: "books",
    orderBy: "newest",
    maxResults: 40,
    ...options,
  })
  return volumes.map(normalizeVolume)
}

/**
 * Search for authors matching a query.
 * Because Google Books has no dedicated author endpoint, this fetches up to
 * 40 volumes with `inauthor:<query>` and aggregates unique author names.
 * Each result includes a `sampleBooks` list (up to 5 of their found books).
 *
 * @example
 * const authors = await searchAuthors("tolkien")
 * // [{ name: "J.R.R. Tolkien", bookCount: 12, sampleBooks: [...] }, ...]
 */
export async function searchAuthors(
  query: string,
  options?: SearchOptions
): Promise<NormalizedAuthor[]> {
  // General query across all fields — casts the widest net so less-known
  // authors with few indexed books are still surfaced. Results are still
  // grouped by volumeInfo.authors, so unrelated works fall under different names.
  const volumes = await fetchVolumes(query, {
    maxResults: 40,
    printType: "books",
    orderBy: "newest",
    ...options,
  })

  const authorMap = new Map<string, NormalizedBook[]>()

  for (const volume of volumes) {
    const book = normalizeVolume(volume)
    const names = volume.volumeInfo.authors ?? [book.authorName]

    for (const name of names) {
      const key = name.trim()
      if (!key) continue
      const existing = authorMap.get(key)
      if (existing) {
        existing.push(book)
      } else {
        authorMap.set(key, [book])
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

/**
 * Fetch a single book by its Google Books volume ID.
 * Returns `null` if the volume does not exist or the request fails.
 *
 * @example
 * const book = await getBookById("zyTCAlFPjgYC")
 */
export async function getBookById(
  googleId: string
): Promise<NormalizedBook | null> {
  const params = new URLSearchParams()
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY)
  }
  const qs = params.toString()
  const res = await fetch(
    `${BASE_URL}/volumes/${googleId}${qs ? `?${qs}` : ""}`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return null
  const volume: GoogleBooksVolume = await res.json()
  return normalizeVolume(volume)
}
