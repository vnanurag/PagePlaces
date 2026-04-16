import type { NormalizedAuthor, NormalizedBook } from "@/lib/types"

const BASE_URL = "https://openlibrary.org"
const COVERS_URL = "https://covers.openlibrary.org"

// ─────────────────────────────────────────────
// Raw Open Library types
// ─────────────────────────────────────────────

interface OLSearchDoc {
  key: string              // e.g. "/works/OL123W"
  title: string
  author_name?: string[]
  first_publish_year?: number
  isbn?: string[]
  cover_i?: number
  subject?: string[]
  number_of_pages_median?: number
  language?: string[]
  ratings_average?: number
  ratings_count?: number
}

interface OLSearchResponse {
  numFound: number
  docs: OLSearchDoc[]
}

// Limit fields returned to keep responses small
const FIELDS =
  "key,title,author_name,first_publish_year,isbn,cover_i,subject,number_of_pages_median,language,ratings_average,ratings_count"

// ─────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────

/** Prefix OL work keys so they never collide with Google Books volume IDs. */
function olId(key: string) {
  return "ol:" + key.replace("/works/", "")
}

function normalizeDoc(doc: OLSearchDoc): NormalizedBook {
  const coverUrl = doc.cover_i
    ? `${COVERS_URL}/b/id/${doc.cover_i}-M.jpg`
    : null

  return {
    googleId: olId(doc.key),
    title: doc.title ?? "Untitled",
    subtitle: null,
    isbn: doc.isbn?.[0] ?? null,
    description: null,
    pageCount: doc.number_of_pages_median ?? null,
    imageUrl: coverUrl,
    publishedAt: doc.first_publish_year ? String(doc.first_publish_year) : null,
    publisher: null,
    language: doc.language?.[0] ?? null,
    categories: doc.subject?.slice(0, 3) ?? [],
    averageRating: doc.ratings_average ?? null,
    ratingsCount: doc.ratings_count ?? null,
    authorName: doc.author_name?.[0] ?? "Unknown Author",
  }
}

async function fetchDocs(
  params: Record<string, string>
): Promise<OLSearchDoc[]> {
  const qs = new URLSearchParams({ ...params, fields: FIELDS })
  const res = await fetch(`${BASE_URL}/search.json?${qs}`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) {
    throw new Error(`Open Library API error: ${res.status} ${res.statusText}`)
  }
  const json: OLSearchResponse = await res.json()
  return json.docs ?? []
}

// ─────────────────────────────────────────────
// Public API  (same signatures as lib/google-books.ts)
// ─────────────────────────────────────────────

/** Full-text book search. */
export async function searchBooksOL(
  query: string,
  options?: { maxResults?: number }
): Promise<NormalizedBook[]> {
  const docs = await fetchDocs({
    q: query,
    limit: String(options?.maxResults ?? 20),
  })
  return docs.map(normalizeDoc)
}

/** Search for books by a specific author name. */
export async function searchBooksByAuthorOL(
  authorName: string,
  options?: { maxResults?: number }
): Promise<NormalizedBook[]> {
  const docs = await fetchDocs({
    author: authorName,
    limit: String(options?.maxResults ?? 20),
  })
  return docs.map(normalizeDoc)
}

/**
 * Search for authors matching a query.
 * Fetches up to 40 books matching `author:<query>` and aggregates unique
 * author names — identical pattern to the Google Books implementation.
 */
export async function searchAuthorsOL(
  query: string
): Promise<NormalizedAuthor[]> {
  const docs = await fetchDocs({ author: query, limit: "40" })

  const authorMap = new Map<string, NormalizedBook[]>()

  for (const doc of docs) {
    const book = normalizeDoc(doc)
    const names = doc.author_name ?? [book.authorName]

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
