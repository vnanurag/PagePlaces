import Link from "next/link"
import { auth } from "@/auth"
import { BookMarked, Search, Library, MapPin, ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

const FEATURES = [
  {
    icon: Search,
    title: "Search Books",
    description: "Find any book by author via Google Books and save it to your library instantly.",
    href: "/dashboard",
  },
  {
    icon: Library,
    title: "My Library",
    description: "Browse and filter your saved collection with location counts at a glance.",
    href: "/library",
  },
  {
    icon: MapPin,
    title: "Place on a Map",
    description: "Drop pins to track where you bought, received, gifted, or read each book.",
    href: "/library",
  },
]

export default async function Home() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Nav ── */}
      <header className="shrink-0 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <BookMarked className="size-4" aria-hidden="true" />
            PagePlaces
          </span>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
                Go to app
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Sign in
                </Link>
                <Link href="/register" className={buttonVariants({ size: "sm" })}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* ── Hero ── */}
        <section className="shrink-0 px-4 py-8 text-center sm:py-10">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden="true" />
            Track every book&apos;s journey
          </div>
          <h1 className="mx-auto max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
            Remember where every book has been
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground sm:max-w-md">
            Build your personal library and pin the exact spots where you
            bought, received, gifted, or read each book.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
                Go to dashboard <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/register" className={buttonVariants({ size: "sm" })}>
                  Get started free <ArrowRight className="size-3.5" />
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="flex-1 border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-6">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Features
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {FEATURES.map(({ icon: Icon, title, description, href }, i) => (
                <Link
                  key={title}
                  href={href}
                  className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 ${i < FEATURES.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
                    <Icon className="size-4 text-foreground" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-none">{title}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground sm:whitespace-normal">
                      {description}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookMarked className="size-3" aria-hidden="true" />
            PagePlaces
          </span>
          <span className="hidden sm:block">Track the places your books have been.</span>
        </div>
      </footer>
    </div>
  )
}
