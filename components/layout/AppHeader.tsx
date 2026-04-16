import Link from "next/link"
import { BookMarked } from "lucide-react"
import { NavLinks } from "@/components/layout/NavLinks"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity">
          <BookMarked className="size-4" aria-hidden="true" />
          PagePlaces
        </Link>

        <NavLinks />
      </div>
    </header>
  )
}
