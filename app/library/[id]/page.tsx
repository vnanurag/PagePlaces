import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/db"
import { AppHeader } from "@/components/layout/AppHeader"
import {
  BookDetailClient,
  type BookInfo,
} from "@/components/book/BookDetailClient"
import type { LocationPoint } from "@/components/book/BookDetailMap"

type Params = { params: Promise<{ id: string }> }

export default async function BookDetailPage({ params }: Params) {
  const session = await verifySession()
  const { id } = await params

  const userBook = await prisma.userBook.findFirst({
    where: { id, userId: session.user.id },
    include: {
      book: { include: { author: true } },
      locations: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!userBook) notFound()

  const { book, locations, notes } = userBook

  const bookInfo: BookInfo = {
    title: book.title,
    subtitle: book.subtitle,
    authorName: book.author.name,
    imageUrl: book.imageUrl,
    publishedAt: book.publishedAt ? book.publishedAt.toISOString() : null,
    pageCount: book.pageCount,
    userNotes: notes,
  }

  const locationPoints: LocationPoint[] = locations.map((l) => ({
    id: l.id,
    latitude: l.latitude,
    longitude: l.longitude,
    address: l.address,
    city: l.city,
    country: l.country,
    notes: l.notes,
    locationType: l.locationType,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <AppHeader
        userEmail={session.user.email ?? ""}
        userName={session.user.name}
      />
      <BookDetailClient
        userBookId={id}
        book={bookInfo}
        initialLocations={locationPoints}
      />
    </div>
  )
}
