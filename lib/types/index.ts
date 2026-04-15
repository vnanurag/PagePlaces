import type {
  Author,
  Book,
  BookLocation,
  LocationType,
  UserBook,
} from "@/app/generated/prisma/client"

// ─────────────────────────────────────────────
// Composed DB types
// ─────────────────────────────────────────────

export type BookWithAuthor = Book & {
  author: Author
}

export type UserBookWithDetails = UserBook & {
  book: BookWithAuthor
  locations: BookLocation[]
}

export type BookLocationWithBook = BookLocation & {
  userBook: UserBook & {
    book: BookWithAuthor
  }
}

// ─────────────────────────────────────────────
// Map types
// ─────────────────────────────────────────────

export type MapMarkerData = {
  id: string
  latitude: number
  longitude: number
  locationType: LocationType
  notes: string | null
  book: {
    id: string
    title: string
    imageUrl: string | null
    author: {
      name: string
    }
  }
  userBookId: string
}

// ─────────────────────────────────────────────
// Google Books API raw types
// ─────────────────────────────────────────────

export type GoogleBooksVolume = {
  id: string
  volumeInfo: {
    title: string
    subtitle?: string
    authors?: string[]
    description?: string
    pageCount?: number
    publishedDate?: string
    publisher?: string
    language?: string
    categories?: string[]
    averageRating?: number
    ratingsCount?: number
    imageLinks?: {
      extraLarge?: string
      large?: string
      medium?: string
      small?: string
      thumbnail?: string
      smallThumbnail?: string
    }
    industryIdentifiers?: Array<{
      type: "ISBN_10" | "ISBN_13" | "ISSN" | "OTHER"
      identifier: string
    }>
    previewLink?: string
    infoLink?: string
  }
}

export type GoogleBooksSearchResponse = {
  totalItems: number
  items?: GoogleBooksVolume[]
}

// ─────────────────────────────────────────────
// Normalized internal types
// ─────────────────────────────────────────────

/** Normalized book derived from a Google Books volume. All optional fields are
 *  explicit `null` (never `undefined`) so callers don't need nullish checks. */
export type NormalizedBook = {
  googleId: string
  title: string
  subtitle: string | null
  isbn: string | null
  description: string | null
  pageCount: number | null
  imageUrl: string | null
  publishedAt: string | null
  publisher: string | null
  language: string | null
  categories: string[]
  averageRating: number | null
  ratingsCount: number | null
  authorName: string
}

/** Author derived by aggregating volumes returned by the Google Books search. */
export type NormalizedAuthor = {
  name: string
  bookCount: number
  sampleBooks: NormalizedBook[]
}

// ─────────────────────────────────────────────
// API response wrapper
// ─────────────────────────────────────────────

export type ApiResponse<T = void> =
  | { data: T; error?: never }
  | { data?: never; error: string }
