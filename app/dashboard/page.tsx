import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/db"
import { AppHeader } from "@/components/layout/AppHeader"
import { AuthorSearch } from "@/components/dashboard/AuthorSearch"

export default async function DashboardPage() {
  const session = await verifySession()

  const userBooks = await prisma.userBook.findMany({
    where: { userId: session.user.id },
    select: { book: { select: { googleId: true } } },
  })

  const savedGoogleIds = userBooks
    .map((r) => r.book.googleId)
    .filter((id): id is string => id !== null)

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        userEmail={session.user.email ?? ""}
        userName={session.user.name}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight">Search books</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {savedGoogleIds.length === 0
              ? "Your library is empty — search for an author below to get started."
              : `${savedGoogleIds.length} ${savedGoogleIds.length === 1 ? "book" : "books"} in your library`}
          </p>
        </div>

        <AuthorSearch initialSavedIds={savedGoogleIds} />
      </main>
    </div>
  )
}
