import { Suspense } from "react"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/db"
import { AppHeader } from "@/components/layout/AppHeader"
import { BookGrid, BookGridSkeleton, type LibraryBook } from "@/components/library/BookGrid"

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function LibraryPage() {
  const session = await verifySession()

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        userEmail={session.user.email ?? ""}
        userName={session.user.name}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight">My Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All books you&apos;ve saved
          </p>
        </div>

        <Suspense fallback={<BookGridSkeleton />}>
          <LibraryBooks userId={session.user.id} />
        </Suspense>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────
// Data layer (separate async component for Suspense)
// ─────────────────────────────────────────────

async function LibraryBooks({ userId }: { userId: string }) {
  const rows = await prisma.userBook.findMany({
    where: { userId },
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
