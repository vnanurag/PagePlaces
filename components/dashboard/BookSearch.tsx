"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  Loader2,
  BookOpen,
  Check,
  Plus,
  AlertCircle,
  UsersRound,
  Library,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { saveBookAction } from "@/lib/actions/books"
import type { ApiResponse, NormalizedAuthor, NormalizedBook } from "@/lib/types"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type SearchMode = "author" | "title"
type SearchStatus = "idle" | "loading" | "error" | "done"
type SaveStatus = "idle" | "saving" | "error"

interface SavedEntry {
  userBookId: string
}

// ─────────────────────────────────────────────
// BookSearch (main exported component)
// ─────────────────────────────────────────────

interface BookSearchProps {
  /** googleId → userBookId for books already in the library */
  initialSavedMap: Record<string, string>
}

export function BookSearch({ initialSavedMap }: BookSearchProps) {
  const [mode, setMode] = useState<SearchMode>("author")
  const [query, setQuery] = useState("")
  const [authorResults, setAuthorResults] = useState<NormalizedAuthor[]>([])
  const [bookResults, setBookResults] = useState<NormalizedBook[]>([])
  const [status, setStatus] = useState<SearchStatus>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // googleId → { userBookId } for saved books
  const [savedMap, setSavedMap] = useState<Map<string, SavedEntry>>(
    () => new Map(Object.entries(initialSavedMap).map(([gId, ubId]) => [gId, { userBookId: ubId }]))
  )
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({})

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const doSearch = useCallback(async (q: string, currentMode: SearchMode) => {
    if (q.trim().length < 2) {
      setAuthorResults([])
      setBookResults([])
      setStatus("idle")
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus("loading")
    setErrorMsg(null)

    try {
      const url = currentMode === "author"
        ? `/api/google-books/authors?q=${encodeURIComponent(q.trim())}`
        : `/api/google-books/search?q=${encodeURIComponent(q.trim())}&maxResults=20`

      const res = await fetch(url, { signal: controller.signal })
      const json: ApiResponse<NormalizedAuthor[] | NormalizedBook[]> = await res.json()

      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? "Search failed. Please try again.")
        setStatus("error")
        return
      }

      if (currentMode === "author") {
        setAuthorResults((json.data as NormalizedAuthor[]) ?? [])
        setBookResults([])
      } else {
        setBookResults((json.data as NormalizedBook[]) ?? [])
        setAuthorResults([])
      }
      setStatus("done")
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setErrorMsg("Could not reach the search service.")
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query, mode), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, mode, doSearch])

  useEffect(() => () => abortRef.current?.abort(), [])

  // Reset results when mode switches
  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode)
    setAuthorResults([])
    setBookResults([])
    setStatus(query.trim().length >= 2 ? "loading" : "idle")
  }

  const handleSave = useCallback(async (book: NormalizedBook) => {
    const gId = book.googleId
    setSaveStatuses((prev) => ({ ...prev, [gId]: "saving" }))

    const result = await saveBookAction(book)

    if (result.success) {
      setSavedMap((prev) => new Map(prev).set(gId, { userBookId: result.userBookId }))
      setSaveStatuses((prev) => {
        const next = { ...prev }
        delete next[gId]
        return next
      })
    } else {
      setSaveStatuses((prev) => ({ ...prev, [gId]: "error" }))
      setTimeout(() =>
        setSaveStatuses((prev) => {
          const next = { ...prev }
          delete next[gId]
          return next
        }), 2500
      )
    }
  }, [])

  const getSaveInfo = useCallback(
    (googleId: string) => ({
      saved: savedMap.has(googleId),
      userBookId: savedMap.get(googleId)?.userBookId ?? null,
      saveStatus: saveStatuses[googleId] ?? "idle",
    }),
    [savedMap, saveStatuses]
  )

  const hasResults =
    (mode === "author" && authorResults.length > 0) ||
    (mode === "title" && bookResults.length > 0)

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Mode toggle */}
        <div className="flex shrink-0 rounded-lg border border-border bg-muted/50 p-0.5">
          {(["author", "title"] as SearchMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "author" ? "By Author" : "By Title"}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          {status === "loading" ? (
            <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none" />
          ) : (
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          )}
          <Input
            type="search"
            placeholder={mode === "author" ? "Search for an author…" : "Search for a book title…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoComplete="off"
          />
        </div>
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
          heading={mode === "author" ? "Search by author" : "Search by title"}
          body={
            mode === "author"
              ? "Type an author name to see their books from the Google Books catalogue."
              : "Type a book title to find and add it to your library."
          }
        />
      )}

      {/* Empty results */}
      {status === "done" && !hasResults && (
        <EmptyState
          icon={<BookOpen className="size-9 text-muted-foreground/30" />}
          heading="No results found"
          body={`Nothing matched "${query}". Try a different spelling or switch search mode.`}
        />
      )}

      {/* Author mode results */}
      {status === "done" && mode === "author" && authorResults.length > 0 && (
        <ul className="space-y-4" role="list">
          {authorResults.map((author) => (
            <li key={author.name}>
              <AuthorCard author={author} getSaveInfo={getSaveInfo} onSave={handleSave} />
            </li>
          ))}
        </ul>
      )}

      {/* Title mode results */}
      {status === "done" && mode === "title" && bookResults.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <ul className="divide-y divide-border" role="list">
            {bookResults.map((book) => {
              const { saved, userBookId, saveStatus } = getSaveInfo(book.googleId)
              return (
                <li key={book.googleId}>
                  <BookRow
                    book={book}
                    saved={saved}
                    userBookId={userBookId}
                    saveStatus={saveStatus}
                    onSave={() => handleSave(book)}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────

function EmptyState({ icon, heading, body }: { icon: ReactNode; heading: string; body: string }) {
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
  getSaveInfo,
  onSave,
}: {
  author: NormalizedAuthor
  getSaveInfo: (id: string) => { saved: boolean; userBookId: string | null; saveStatus: SaveStatus }
  onSave: (book: NormalizedBook) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
        <span className="text-sm font-semibold">{author.name}</span>
        <span className="text-xs text-muted-foreground">
          {author.bookCount} {author.bookCount === 1 ? "book" : "books"}
        </span>
      </div>
      <ul className="divide-y divide-border" role="list">
        {author.sampleBooks.map((book) => {
          const { saved, userBookId, saveStatus } = getSaveInfo(book.googleId)
          return (
            <li key={book.googleId}>
              <BookRow
                book={book}
                saved={saved}
                userBookId={userBookId}
                saveStatus={saveStatus}
                onSave={() => onSave(book)}
              />
            </li>
          )
        })}
      </ul>
      {author.bookCount > author.sampleBooks.length && (
        <div className="border-t border-border bg-muted/20 px-4 py-2 text-center text-xs text-muted-foreground">
          Showing {author.sampleBooks.length} of {author.bookCount} books — refine your search to see more
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
  saved,
  userBookId,
  saveStatus,
  onSave,
}: {
  book: NormalizedBook
  saved: boolean
  userBookId: string | null
  saveStatus: SaveStatus
  onSave: () => void
}) {
  const year = book.publishedAt ? book.publishedAt.slice(0, 4) : null
  const meta = [year, book.categories[0]].filter(Boolean).join(" · ")

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded-sm bg-muted">
        {book.imageUrl ? (
          <Image src={book.imageUrl} alt="" fill className="object-cover" sizes="32px" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="size-4 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-snug">{book.title}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>

      <ActionButton
        saved={saved}
        userBookId={userBookId}
        saveStatus={saveStatus}
        onSave={onSave}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// ActionButton
// ─────────────────────────────────────────────

function ActionButton({
  saved,
  userBookId,
  saveStatus,
  onSave,
}: {
  saved: boolean
  userBookId: string | null
  saveStatus: SaveStatus
  onSave: () => void
}) {
  if (saved && userBookId) {
    return (
      <Link href={`/library/${userBookId}`}>
        <Button size="sm" variant="secondary" className="shrink-0 gap-1 text-xs">
          <Library className="size-3" />
          In Library
        </Button>
      </Link>
    )
  }

  if (saved) {
    return (
      <Button size="sm" variant="secondary" disabled className="shrink-0 gap-1 text-xs">
        <Check className="size-3" />
        Saved
      </Button>
    )
  }

  if (saveStatus === "saving") {
    return (
      <Button size="sm" variant="outline" disabled className="w-16 shrink-0">
        <Loader2 className="size-3.5 animate-spin" />
      </Button>
    )
  }

  if (saveStatus === "error") {
    return (
      <Button size="sm" variant="destructive" disabled className="shrink-0 text-xs">
        Failed
      </Button>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={onSave} className="shrink-0 gap-1 text-xs">
      <Plus className="size-3" />
      Add
    </Button>
  )
}
