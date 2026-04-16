import { BookMarked } from "lucide-react"
import { logoutAction } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { NavLinks } from "@/components/layout/NavLinks"

interface AppHeaderProps {
  userEmail: string
  userName?: string | null
}

export function AppHeader({ userEmail, userName }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tracking-tight">
          <BookMarked className="size-4" aria-hidden="true" />
          PagePlaces
        </span>

        <NavLinks />

        {/* AUTH UI — uncomment to re-enable sign out
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {userName ?? userEmail}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
        */}
      </div>
    </header>
  )
}
