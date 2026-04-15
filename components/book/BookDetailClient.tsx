"use client"

import { useCallback, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  BookOpen,
  Calendar,
  FileText,
  Plus,
  Check,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LocationDrawer } from "./LocationDrawer"
import type { LocationPoint } from "./BookDetailMap"
import { cn } from "@/lib/utils"

// Leaflet must never run on the server
const BookDetailMap = dynamic(
  () => import("./BookDetailMap").then((m) => m.BookDetailMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
  }
)

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type BookInfo = {
  title: string
  subtitle: string | null
  authorName: string
  imageUrl: string | null
  publishedAt: string | null
  pageCount: number | null
  userNotes: string | null
}

type Toast = { id: string; message: string; type: "success" | "error" }

type DrawerState =
  | null
  | { mode: "add" }
  | { mode: "edit"; location: LocationPoint }

const LOCATION_LABELS: Record<string, string> = {
  PURCHASED: "Purchased",
  RECEIVED: "Received",
  GIFTED: "Gifted",
  READ: "Read",
  OTHER: "Other",
}

const LOCATION_BADGE: Record<string, string> = {
  PURCHASED: "bg-blue-50 text-blue-700 border-blue-200",
  RECEIVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  GIFTED: "bg-pink-50 text-pink-700 border-pink-200",
  READ: "bg-amber-50 text-amber-700 border-amber-200",
  OTHER: "bg-muted text-muted-foreground border-border",
}

// ─────────────────────────────────────────────
// BookDetailClient
// ─────────────────────────────────────────────

interface BookDetailClientProps {
  userBookId: string
  book: BookInfo
  initialLocations: LocationPoint[]
}

export function BookDetailClient({
  userBookId,
  book,
  initialLocations,
}: BookDetailClientProps) {
  const [locations, setLocations] = useState<LocationPoint[]>(initialLocations)
  const [drawerState, setDrawerState] = useState<DrawerState>(null)
  const [pendingPin, setPendingPin] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  // ── Toast helpers ──────────────────────────────

  const addToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3500
      )
    },
    []
  )

  // ── Map click → open/update drawer ────────────

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setPendingPin({ lat, lng })
      if (drawerState === null) {
        setDrawerState({ mode: "add" })
      }
    },
    [drawerState]
  )

  // ── Drawer close ───────────────────────────────

  const handleCloseDrawer = useCallback(() => {
    setDrawerState(null)
    setPendingPin(null)
  }, [])

  // ── Save (add or edit) ─────────────────────────

  const handleSaved = useCallback(
    (location: LocationPoint) => {
      const isEdit = drawerState?.mode === "edit"
      setLocations((prev) => {
        if (isEdit) {
          return prev.map((l) => (l.id === location.id ? location : l))
        }
        return [location, ...prev]
      })
      handleCloseDrawer()
      addToast(isEdit ? "Location updated" : "Location added")
    },
    [drawerState, handleCloseDrawer, addToast]
  )

  // ── Delete ─────────────────────────────────────

  const handleDeleted = useCallback(
    (locationId: string) => {
      setLocations((prev) => prev.filter((l) => l.id !== locationId))
      handleCloseDrawer()
      addToast("Location deleted")
    },
    [handleCloseDrawer, addToast]
  )

  // ── Preview pin on map ─────────────────────────

  const previewPin =
    drawerState !== null
      ? pendingPin ??
        (drawerState.mode === "edit"
          ? {
              lat: drawerState.location.latitude,
              lng: drawerState.location.longitude,
            }
          : null)
      : null

  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">

      {/* ── Sidebar ──────────────────────────────── */}
      <aside className="order-last flex flex-col overflow-y-auto border-t border-border lg:order-first lg:w-80 lg:shrink-0 lg:border-t-0 lg:border-r xl:w-96">

        {/* Back link */}
        <div className="px-5 pt-5 pb-3">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            My Library
          </Link>
        </div>

        {/* Book info */}
        <div className="px-5 pb-6">
          {book.imageUrl && (
            <div className="relative mb-4 h-40 w-[107px] overflow-hidden rounded-lg shadow-md">
              <Image
                src={book.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="107px"
              />
            </div>
          )}

          <h1 className="text-lg font-semibold leading-snug">{book.title}</h1>
          {book.subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {book.subtitle}
            </p>
          )}
          <p className="mt-1 text-sm font-medium">{book.authorName}</p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {book.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {new Date(book.publishedAt).getFullYear()}
              </span>
            )}
            {book.pageCount && (
              <span className="flex items-center gap-1">
                <BookOpen className="size-3" />
                {book.pageCount} pages
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {locations.length}{" "}
              {locations.length === 1 ? "location" : "locations"}
            </span>
          </div>

          {book.userNotes && (
            <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FileText className="size-3" />
                Notes
              </p>
              <p className="text-sm">{book.userNotes}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-border" />

        {/* Locations section */}
        <div className="px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Locations
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDrawerState({ mode: "add" })}
              className="gap-1 text-xs"
            >
              <Plus className="size-3" />
              Add
            </Button>
          </div>

          {locations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MapPin className="size-8 text-muted-foreground/25" />
              <p className="text-sm font-medium">No locations yet</p>
              <p className="text-xs text-muted-foreground">
                Click anywhere on the map or press Add
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {locations.map((loc) => (
                <li key={loc.id}>
                  <LocationItem
                    location={loc}
                    onEdit={() =>
                      setDrawerState({ mode: "edit", location: loc })
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* ── Map ──────────────────────────────────── */}
      <div className="order-first h-64 shrink-0 sm:h-80 lg:order-last lg:h-auto lg:flex-1">
        <BookDetailMap
          locations={locations}
          onMapClick={handleMapClick}
          previewPin={previewPin}
        />
      </div>

      {/* ── Drawer ───────────────────────────────── */}
      {drawerState !== null && (
        <LocationDrawer
          mode={drawerState.mode}
          userBookId={userBookId}
          location={drawerState.mode === "edit" ? drawerState.location : undefined}
          pendingPin={pendingPin}
          onClose={handleCloseDrawer}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {/* ── Toasts ───────────────────────────────── */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[3000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
              t.type === "success"
                ? "bg-foreground text-background"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {t.type === "success" ? (
              <Check className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// LocationItem
// ─────────────────────────────────────────────

function LocationItem({
  location,
  onEdit,
}: {
  location: LocationPoint
  onEdit: () => void
}) {
  const label = LOCATION_LABELS[location.locationType] ?? location.locationType
  const badge = LOCATION_BADGE[location.locationType] ?? LOCATION_BADGE.OTHER
  const place = [location.city, location.country].filter(Boolean).join(", ")
  const date = new Date(location.createdAt).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  })

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Edit ${LOCATION_LABELS[location.locationType] ?? location.locationType} location${
        location.city ? ` in ${location.city}` : ""
      }`}
      className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge}`}
        >
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>

      {place && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
          {place}
        </p>
      )}

      {location.address && (
        <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
          {location.address}
        </p>
      )}

      {location.notes && (
        <p className="mt-1.5 text-xs italic text-muted-foreground">
          {location.notes}
        </p>
      )}
    </button>
  )
}
