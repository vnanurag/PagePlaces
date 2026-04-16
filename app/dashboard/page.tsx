import { prisma } from "@/lib/db"
import { AppHeader } from "@/components/layout/AppHeader"
import { BookSearch } from "@/components/dashboard/BookSearch"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const userBooks = await prisma.userBook.findMany({
    select: { id: true, book: { select: { googleId: true } } },
  })

  const savedMap: Record<string, string> = {}
  for (const r of userBooks) {
    if (r.book.googleId) savedMap[r.book.googleId] = r.id
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight">Search books</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {Object.keys(savedMap).length === 0
              ? "Your library is empty — search below to get started."
              : `${Object.keys(savedMap).length} ${Object.keys(savedMap).length === 1 ? "book" : "books"} in your library`}
          </p>
        </div>

        <BookSearch initialSavedMap={savedMap} />
      </main>
    </div>
  )
}
