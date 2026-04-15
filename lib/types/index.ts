import type {
  Author,
  Book,
  BookLocation,
  LocationType,
  UserBook,
} from "@/app/generated/prisma"

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
// Google Books API types
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
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
  }
}

export type GoogleBooksSearchResponse = {
  totalItems: number
  items?: GoogleBooksVolume[]
}

// ─────────────────────────────────────────────
// API response wrapper
// ─────────────────────────────────────────────

export type ApiResponse<T = void> =
  | { data: T; error?: never }
  | { data?: never; error: string }
