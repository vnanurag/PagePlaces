"use server"

import { verifySession } from "@/lib/dal"
import { prisma } from "@/lib/db"
import { addLocationSchema } from "@/lib/validations/books"
import type { LocationPoint } from "@/components/book/BookDetailMap"

// ─────────────────────────────────────────────
// Return types
// ─────────────────────────────────────────────

export type LocationActionResult =
  | { success: true; location: LocationPoint }
  | { success: false; error: string }

export type DeleteLocationResult =
  | { success: true }
  | { success: false; error: string }

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function serialize(l: {
  id: string
  latitude: number
  longitude: number
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  locationType: string
  createdAt: Date
}): LocationPoint {
  return {
    id: l.id,
    latitude: l.latitude,
    longitude: l.longitude,
    address: l.address,
    city: l.city,
    country: l.country,
    notes: l.notes,
    locationType: l.locationType,
    createdAt: l.createdAt.toISOString(),
  }
}

// ─────────────────────────────────────────────
// addLocationAction
// ─────────────────────────────────────────────

export async function addLocationAction(
  userBookId: string,
  data: unknown
): Promise<LocationActionResult> {
  const session = await verifySession()

  const parsed = addLocationSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid location data." }

  const owned = await prisma.userBook.findFirst({
    where: { id: userBookId, userId: session.user.id },
    select: { id: true },
  })
  if (!owned) return { success: false, error: "Book not found." }

  try {
    const location = await prisma.bookLocation.create({
      data: { ...parsed.data, userBookId },
    })
    return { success: true, location: serialize(location) }
  } catch {
    return { success: false, error: "Failed to save location." }
  }
}

// ─────────────────────────────────────────────
// updateLocationAction
// ─────────────────────────────────────────────

export async function updateLocationAction(
  locationId: string,
  userBookId: string,
  data: unknown
): Promise<LocationActionResult> {
  const session = await verifySession()

  const parsed = addLocationSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: "Invalid location data." }

  const existing = await prisma.bookLocation.findFirst({
    where: {
      id: locationId,
      userBook: { id: userBookId, userId: session.user.id },
    },
    select: { id: true },
  })
  if (!existing) return { success: false, error: "Location not found." }

  try {
    const location = await prisma.bookLocation.update({
      where: { id: locationId },
      data: parsed.data,
    })
    return { success: true, location: serialize(location) }
  } catch {
    return { success: false, error: "Failed to update location." }
  }
}

// ─────────────────────────────────────────────
// deleteLocationAction
// ─────────────────────────────────────────────

export async function deleteLocationAction(
  locationId: string,
  userBookId: string
): Promise<DeleteLocationResult> {
  const session = await verifySession()

  const existing = await prisma.bookLocation.findFirst({
    where: {
      id: locationId,
      userBook: { id: userBookId, userId: session.user.id },
    },
    select: { id: true },
  })
  if (!existing) return { success: false, error: "Location not found." }

  try {
    await prisma.bookLocation.delete({ where: { id: locationId } })
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete location." }
  }
}
