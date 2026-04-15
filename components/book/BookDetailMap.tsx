"use client"

import { useEffect } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// Types (exported for the server page)
// ─────────────────────────────────────────────

export type LocationPoint = {
  id: string
  latitude: number
  longitude: number
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  locationType: string
  createdAt: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const LOCATION_LABELS: Record<string, string> = {
  PURCHASED: "Purchased",
  RECEIVED: "Received",
  GIFTED: "Gifted",
  READ: "Read",
  OTHER: "Other",
}

// Custom dot icon — avoids Leaflet's webpack image-resolution issue entirely
const dotIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:#2563eb;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -12],
})

// Amber preview pin shown while the drawer is open
const previewIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:#f59e0b;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -12],
})

// ─────────────────────────────────────────────
// MapClickHandler — captures map clicks for pin drop
// ─────────────────────────────────────────────

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ─────────────────────────────────────────────
// MapFit — runs inside MapContainer, owns the view
// ─────────────────────────────────────────────

function MapFit({ locations }: { locations: LocationPoint[] }) {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 0) return

    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 13, {
        animate: false,
      })
    } else {
      const bounds = L.latLngBounds(
        locations.map((l) => [l.latitude, l.longitude] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50], animate: false })
    }
  }, [map, locations])

  return null
}

// ─────────────────────────────────────────────
// BookDetailMap
// ─────────────────────────────────────────────

interface BookDetailMapProps {
  locations: LocationPoint[]
  onMapClick?: (lat: number, lng: number) => void
  previewPin?: { lat: number; lng: number } | null
}

export function BookDetailMap({
  locations,
  onMapClick,
  previewPin,
}: BookDetailMapProps) {
  const isPinMode = !!onMapClick

  return (
    <div className={cn("relative h-full w-full", isPinMode && "cursor-crosshair")}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFit locations={locations} />

        {onMapClick && <MapClickHandler onClick={onMapClick} />}

        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={dotIcon}
          >
            <Popup minWidth={180}>
              <div className="space-y-1 py-0.5">
                <p className="font-semibold text-sm">
                  {LOCATION_LABELS[loc.locationType] ?? loc.locationType}
                </p>
                {(loc.city || loc.country) && (
                  <p className="text-sm text-gray-600">
                    {[loc.city, loc.country].filter(Boolean).join(", ")}
                  </p>
                )}
                {loc.address && (
                  <p className="text-xs text-gray-500">{loc.address}</p>
                )}
                {loc.notes && (
                  <p className="mt-1.5 text-xs italic text-gray-500">
                    {loc.notes}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Amber preview pin for the currently-open drawer */}
        {previewPin && (
          <Marker
            position={[previewPin.lat, previewPin.lng]}
            icon={previewIcon}
          />
        )}
      </MapContainer>

      {/* Pin-drop hint shown while drawer is open */}
      {isPinMode && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2">
          <span className="rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm">
            Click map to drop a pin
          </span>
        </div>
      )}

      {/* No-locations overlay — hidden while drawer is open */}
      {locations.length === 0 && !isPinMode && (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
          <p className="text-sm font-medium">No locations yet</p>
          <p className="text-xs text-muted-foreground">
            Click the map or use the Add button
          </p>
        </div>
      )}
    </div>
  )
}
