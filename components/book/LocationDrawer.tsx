"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, MapPin, Loader2, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  addLocationAction,
  updateLocationAction,
  deleteLocationAction,
} from "@/lib/actions/locations"
import { addLocationSchema } from "@/lib/validations/books"
import type { AddLocationInput } from "@/lib/validations/books"
import type { LocationPoint } from "./BookDetailMap"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const LOCATION_TYPE_OPTIONS = [
  { value: "PURCHASED", label: "Purchased" },
  { value: "RECEIVED", label: "Received" },
  { value: "GIFTED", label: "Gifted" },
  { value: "READ", label: "Read" },
  { value: "OTHER", label: "Other" },
] as const

// ─────────────────────────────────────────────
// LocationDrawer
// ─────────────────────────────────────────────

interface LocationDrawerProps {
  mode: "add" | "edit"
  userBookId: string
  location?: LocationPoint
  pendingPin: { lat: number; lng: number } | null
  onClose: () => void
  onSaved: (location: LocationPoint) => void
  onDeleted: (locationId: string) => void
}

export function LocationDrawer({
  mode,
  userBookId,
  location,
  pendingPin,
  onClose,
  onSaved,
  onDeleted,
}: LocationDrawerProps) {
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Trigger slide-in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddLocationInput>({
    resolver: zodResolver(addLocationSchema),
    defaultValues:
      mode === "edit" && location
        ? {
            locationType: location.locationType as AddLocationInput["locationType"],
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address ?? "",
            city: location.city ?? "",
            country: location.country ?? "",
            notes: location.notes ?? "",
          }
        : {
            locationType: "READ",
            latitude: 0,
            longitude: 0,
            address: "",
            city: "",
            country: "",
            notes: "",
          },
  })

  // Sync pin drop into form fields
  useEffect(() => {
    if (!pendingPin) return
    setValue("latitude", parseFloat(pendingPin.lat.toFixed(6)), {
      shouldValidate: true,
    })
    setValue("longitude", parseFloat(pendingPin.lng.toFixed(6)), {
      shouldValidate: true,
    })
  }, [pendingPin, setValue])

  const onSubmit = async (data: AddLocationInput) => {
    setSubmitting(true)
    setServerError(null)

    const result =
      mode === "edit" && location
        ? await updateLocationAction(location.id, userBookId, data)
        : await addLocationAction(userBookId, data)

    setSubmitting(false)
    if (result.success) {
      onSaved(result.location)
    } else {
      setServerError(result.error)
    }
  }

  const handleDelete = async () => {
    if (!location) return
    setDeleting(true)
    const result = await deleteLocationAction(location.id, userBookId)
    setDeleting(false)
    if (result.success) {
      onDeleted(location.id)
    } else {
      setServerError(result.error)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1999] bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[2000] flex w-full max-w-sm flex-col bg-background shadow-2xl",
          "transition-transform duration-300 ease-out",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">
            {mode === "add" ? "Add location" : "Edit location"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} id="location-form" noValidate>
            <div className="space-y-5 px-5 py-5">

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Type</label>
                <select
                  {...register("locationType")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  {LOCATION_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {errors.locationType && (
                  <p className="text-xs text-destructive">
                    {errors.locationType.message}
                  </p>
                )}
              </div>

              {/* Coordinates */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="size-3.5" />
                  Coordinates
                </label>
                <p className="text-xs text-muted-foreground">
                  Click the map to drop a pin, or enter manually
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      {...register("latitude", { valueAsNumber: true })}
                      type="number"
                      step="any"
                      placeholder="Latitude"
                    />
                    {errors.latitude && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.latitude.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      {...register("longitude", { valueAsNumber: true })}
                      type="number"
                      step="any"
                      placeholder="Longitude"
                    />
                    {errors.longitude && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.longitude.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Address{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input {...register("address")} placeholder="123 Main St" />
              </div>

              {/* City + Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">City</label>
                  <Input {...register("city")} placeholder="New York" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Country</label>
                  <Input {...register("country")} placeholder="USA" />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Notes{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Where I was, what I remember…"
                  className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
                />
              </div>

              {/* Server error */}
              {serverError && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {serverError}
                </div>
              )}

              {/* Inline delete confirmation */}
              {mode === "edit" && confirmDelete && (
                <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive">
                    Delete this location?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1"
                    >
                      {deleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-border px-5 py-4",
            mode === "edit" && !confirmDelete
              ? "flex items-center justify-between gap-3"
              : "flex justify-end"
          )}
        >
          {mode === "edit" && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-sm text-destructive transition-colors hover:text-destructive/80"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          )}

          <Button
            type="submit"
            form="location-form"
            disabled={submitting}
            className="min-w-32"
          >
            {submitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : mode === "add" ? (
              "Add location"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
