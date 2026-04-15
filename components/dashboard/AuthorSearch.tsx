"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import {
  Search,
  Loader2,
  BookOpen,
  Check,
  Plus,
  AlertCircle,
  UsersRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { saveBookAction } from "@/lib/actions/books"
import type { ApiResponse, NormalizedAuthor, NormalizedBook } from "@/lib/types"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type SearchStatus = "idle" | "loading" | "error" | "done"
type SaveState = "idle" | "saving" | "saved" | "error"

// ─────────────────────────────────────────────
// AuthorSearch (main exported component)
// ─────────────────────────────────────────────

interface AuthorSearchProps {
  initialSavedIds: string[]
}

export function AuthorSearch({ initialSavedIds }: AuthorSearchProps) {
  const [query, setQuery] = useState("")
  const [authors, setAuthors] = useState<NormalizedAuthor[]>([])
  const [status, setStatus] = useState<SearchStatus>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds))
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({})

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setAuthors([])
      setStatus("idle")
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus("loading")
    setErrorMsg(null)

    try {
      const res = await fetch(
        `/api/google-books/authors?q=${encodeURIComponent(q.trim())}`,
        { signal: controller.signal }
      )
      const json: ApiResponse<NormalizedAuthor[]> = await res.json()

      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? "Search failed. Please try again.")
        setStatus("error")
        return
      }

      setAuthors(json.data ?? [])
      setStatus("done")
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setErrorMsg("Could not reach the search service.")
      setStatus("error")
    }
  }, [])

  // Debounce: fire 400 ms after last keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  // Cancel in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), [])

  const handleSave = useCallback(async (book: NormalizedBook) => {
    const id = book.googleId
    setSaveStates((prev) => ({ ...prev, [id]: "saving" }))

    const result = await saveBookAction(book)

    if (result.success) {
      setSavedIds((prev) => new Set([...prev, id]))
      setSaveStates((prev) => ({ ...prev, [id]: "saved" }))
    } else {
      setSaveStates((prev) => ({ ...prev, [id]: "error" }))
      setTimeout(
        () =>
          setSaveStates((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          }),
        2500
      )
    }
  }, [])

  const getSaveState = useCallback(
    (googleId: string): SaveState => {
      if (savedIds.has(googleId)) return "saved"
      return saveStates[googleId] ?? "idle"
    },
    [savedIds, saveStates]
  )

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        {status === "loading" ? (
          <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none" />
        ) : (
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        )}
        <Input
          type="search"
          placeholder="Search for an author…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {/* Error banner */}
      {status === "error" && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Idle prompt */}
      {status === "idle" && (
        <EmptyState
          icon={<UsersRound className="size-9 text-muted-foreground/30" />}
          heading="Find books by author"
          body="Type at least 2 characters to search the Google Books catalogue"
        />
      )}

      {/* Empty results */}
      {status === "done" && authors.length === 0 && (
        <EmptyState
          icon={<BookOpen className="size-9 text-muted-foreground/30" />}
          heading="No authors found"
          body={`We couldn't find any authors matching "${query}". Try a different spelling.`}
        />
      )}

      {/* Author results */}
      {status === "done" && authors.length > 0 && (
        <ul className="space-y-4" role="list">
          {authors.map((author) => (
            <li key={author.name}>
              <AuthorCard
                author={author}
                getSaveState={getSaveState}
                onSave={handleSave}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────

function EmptyState({
  icon,
  heading,
  body,
}: {
  icon: ReactNode
  heading: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon}
      <p className="text-sm font-medium text-foreground">{heading}</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// AuthorCard
// ─────────────────────────────────────────────

function AuthorCard({
  author,
  getSaveState,
  onSave,
}: {
  author: NormalizedAuthor
  getSaveState: (id: string) => SaveState
  onSave: (book: NormalizedBook) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Author header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
        <span className="text-sm font-semibold">{author.name}</span>
        <span className="text-xs text-muted-foreground">
          {author.bookCount} {author.bookCount === 1 ? "book" : "books"}
        </span>
      </div>

      {/* Books list */}
      <ul className="divide-y divide-border" role="list">
        {author.sampleBooks.map((book) => (
          <li key={book.googleId}>
            <BookRow
              book={book}
              saveState={getSaveState(book.googleId)}
              onSave={() => onSave(book)}
            />
          </li>
        ))}
      </ul>

      {/* Footer hint when results are capped */}
      {author.bookCount > author.sampleBooks.length && (
        <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">
          Showing {author.sampleBooks.length} of {author.bookCount} books — refine
          your search to see more
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// BookRow
// ─────────────────────────────────────────────

function BookRow({
  book,
  saveState,
  onSave,
}: {
  book: NormalizedBook
  saveState: SaveState
  onSave: () => void
}) {
  const year = book.publishedAt ? book.publishedAt.slice(0, 4) : null
  const meta = [year, book.categories[0]].filter(Boolean).join(" · ")

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Thumbnail */}
      <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded-sm bg-muted">
        {book.imageUrl ? (
          <Image
            src={book.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="size-4 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Book info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-snug">{book.title}</p>
        {meta && (
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        )}
      </div>

      {/* Save button */}
      <SaveButton state={saveState} onSave={onSave} />
    </div>
  )
}

// ─────────────────────────────────────────────
// SaveButton
// ─────────────────────────────────────────────

function SaveButton({
  state,
  onSave,
}: {
  state: SaveState
  onSave: () => void
}) {
  if (state === "saved") {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled
        className="shrink-0 gap-1 text-xs"
      >
        <Check className="size-3" />
        Saved
      </Button>
    )
  }

  if (state === "saving") {
    return (
      <Button size="sm" variant="outline" disabled className="w-16 shrink-0">
        <Loader2 className="size-3.5 animate-spin" />
      </Button>
    )
  }

  if (state === "error") {
    return (
      <Button
        size="sm"
        variant="destructive"
        disabled
        className="shrink-0 text-xs"
      >
        Failed
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onSave}
      className="shrink-0 gap-1 text-xs"
    >
      <Plus className="size-3" />
      Save
    </Button>
  )
}
