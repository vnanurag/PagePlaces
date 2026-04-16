"use client"

import { useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { syncAuthorBooksAction } from "@/lib/actions/books"
import { AUTHOR_NAME } from "@/lib/constants"

type SyncState = "idle" | "syncing" | "done" | "error"

export function SyncButton() {
  const [syncState, setSyncState] = useState<SyncState>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSync = () => {
    setSyncState("syncing")
    setMessage(null)
    startTransition(async () => {
      const result = await syncAuthorBooksAction()
      if (result.success) {
        setSyncState("done")
        setMessage(
          result.added === 0
            ? "Library is already up to date."
            : `${result.added} book${result.added === 1 ? "" : "s"} added to your library.`
        )
      } else {
        setSyncState("error")
        setMessage(result.error)
      }
    })
  }

  const isBusy = syncState === "syncing" || isPending

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isBusy}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isBusy ? "animate-spin" : ""}`} />
        {isBusy ? "Syncing…" : `Sync ${AUTHOR_NAME}'s Books`}
      </Button>
      {message && (
        <span
          className={`text-sm ${
            syncState === "error" ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  )
}
