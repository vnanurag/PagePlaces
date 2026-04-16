import { prisma } from "@/lib/db"
import type { MapMarkerData } from "@/lib/types"

export async function GET() {
  const locations = await prisma.bookLocation.findMany({
    include: {
      userBook: {
        include: {
          book: { include: { author: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const markers: MapMarkerData[] = locations.map((loc) => ({
    id: loc.id,
    latitude: loc.latitude,
    longitude: loc.longitude,
    locationType: loc.locationType,
    notes: loc.notes,
    userBookId: loc.userBookId,
    book: {
      id: loc.userBook.book.id,
      title: loc.userBook.book.title,
      imageUrl: loc.userBook.book.imageUrl,
      author: {
        name: loc.userBook.book.author.name,
      },
    },
  }))

  return Response.json({ data: markers })
}
