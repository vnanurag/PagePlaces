import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { AppHeader } from "@/components/layout/AppHeader"
import { BookGrid, BookGridSkeleton, type LibraryBook } from "@/components/library/BookGrid"
import { SyncButton } from "@/components/library/SyncButton"
import { AUTHOR_NAME } from "@/lib/constants"

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function LibraryPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">My Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Books by {AUTHOR_NAME}
            </p>
          </div>
          <SyncButton />
        </div>

        <Suspense fallback={<BookGridSkeleton />}>
          <LibraryBooks />
        </Suspense>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────
// Data layer (separate async component for Suspense)
// ─────────────────────────────────────────────

async function LibraryBooks() {
  const rows = await prisma.userBook.findMany({
    include: {
      book: { include: { author: true } },
      _count: { select: { locations: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const books: LibraryBook[] = rows.map((r) => ({
    id: r.id,
    bookId: r.book.id,
    title: r.book.title,
    subtitle: r.book.subtitle,
    authorName: r.book.author.name,
    imageUrl: r.book.imageUrl,
    locationCount: r._count.locations,
    addedAt: r.createdAt.toISOString(),
  }))

  return <BookGrid books={books} />
}
