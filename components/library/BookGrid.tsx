"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, MapPin, Library, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type LibraryBook = {
  id: string
  bookId: string
  title: string
  subtitle: string | null
  authorName: string
  imageUrl: string | null
  locationCount: number
  addedAt: string
}

type SortKey = "added-desc" | "title-asc" | "author-asc" | "locations-desc"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "added-desc", label: "Recently added" },
  { value: "title-asc", label: "Title A → Z" },
  { value: "author-asc", label: "Author A → Z" },
  { value: "locations-desc", label: "Most locations" },
]

// ─────────────────────────────────────────────
// BookGrid (main exported component)
// ─────────────────────────────────────────────

export function BookGrid({ books }: { books: LibraryBook[] }) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("added-desc")

  const filtered = useMemo(() => {
    let result = books

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authorName.toLowerCase().includes(q)
      )
    }

    return [...result].sort((a, b) => {
      switch (sortKey) {
        case "title-asc":
          return a.title.localeCompare(b.title)
        case "author-asc":
          return a.authorName.localeCompare(b.authorName)
        case "locations-desc":
          return b.locationCount - a.locationCount
        case "added-desc":
        default:
          return (
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
          )
      }
    })
  }, [books, query, sortKey])

  if (books.length === 0) {
    return <EmptyLibrary />
  }

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <label
            htmlFor="sort"
            className="shrink-0 text-xs text-muted-foreground"
          >
            Sort by
          </label>
          <select
            id="sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      {query.trim() && (
        <p className="text-xs text-muted-foreground">
          {filtered.length === 0
            ? `No books match "${query}"`
            : `${filtered.length} of ${books.length} books`}
        </p>
      )}

      {/* Empty search result */}
      {filtered.length === 0 && query.trim() && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen className="size-9 text-muted-foreground/30" />
          <p className="text-sm font-medium">No matches found</p>
          <p className="text-xs text-muted-foreground">
            Try a different title or author name
          </p>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          role="list"
        >
          {filtered.map((book) => (
            <li key={book.id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// BookCard
// ─────────────────────────────────────────────

function BookCard({ book }: { book: LibraryBook }) {
  return (
    <Link
      href={`/library/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {book.imageUrl ? (
          <Image
            src={book.imageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="size-10 text-muted-foreground/25" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {book.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {book.authorName}
        </p>

        <div className="mt-auto pt-2.5">
          <LocationBadge count={book.locationCount} />
        </div>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────
// LocationBadge
// ─────────────────────────────────────────────

function LocationBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="text-xs text-muted-foreground/50">No locations</span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground"
    >
      <MapPin className="size-3" />
      {count} {count === 1 ? "location" : "locations"}
    </span>
  )
}

// ─────────────────────────────────────────────
// EmptyLibrary
// ─────────────────────────────────────────────

function EmptyLibrary() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <Library className="size-8 text-muted-foreground/50" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Your library is empty</p>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          Search for an author on the{" "}
          <a href="/dashboard" className="underline underline-offset-4">
            Search page
          </a>{" "}
          and save books to your library.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// BookGridSkeleton (Suspense fallback)
// ─────────────────────────────────────────────

export function BookGridSkeleton() {
  return (
    <div className="space-y-5">
      {/* Controls skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-9 w-full animate-pulse rounded-lg bg-muted sm:max-w-xs" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-muted sm:ml-auto" />
      </div>

      {/* Grid skeleton */}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i}>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="aspect-[2/3] w-full animate-pulse bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-3 w-2/5 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
