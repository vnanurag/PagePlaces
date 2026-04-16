import Link from "next/link"
import { auth } from "@/auth"
import { BookMarked, Search, Library, MapPin, ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    icon: Search,
    title: "Search Books",
    description:
      "Search millions of books by author. Find any title instantly and save it to your personal library with one click.",
    href: "/dashboard",
    cta: "Search books",
  },
  {
    icon: Library,
    title: "My Library",
    description:
      "Browse and filter your entire saved collection. See at a glance which books have locations attached.",
    href: "/library",
    cta: "Open library",
  },
  {
    icon: MapPin,
    title: "Place on a Map",
    description:
      "Drop pins on an interactive map to remember where you bought, received, gifted, or read each book.",
    href: "/library",
    cta: "View locations",
  },
]

export default async function Home() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
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

      <main className="flex flex-1 flex-col">
        {/* ── Hero ── */}
        <section className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <MapPin className="size-3" aria-hidden="true" />
            Track every book&apos;s journey
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Remember where every book has been
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            PagePlaces lets you build a personal library and pin the exact spots
            where you bought, received, gifted, or read each book — on an
            interactive map.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isLoggedIn ? (
              <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
                Go to dashboard <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link href="/register" className={buttonVariants({ size: "lg" })}>
                  Get started free <ArrowRight className="size-4" />
                </Link>
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Features
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description, href, cta }) => (
                <Link
                  key={title}
                  href={href}
                  className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-border/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/[0.06]">
                    <Icon className="size-5 text-foreground" aria-hidden="true" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <h3 className="font-semibold tracking-tight">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-foreground transition-gap group-hover:gap-2">
                    {cta} <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        {!isLoggedIn && (
          <section className="border-t border-border">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="text-lg font-semibold tracking-tight">
                  Ready to start tracking?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Free to use. No credit card required.
                </p>
              </div>
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
                Create an account <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookMarked className="size-3" aria-hidden="true" />
            PagePlaces
          </span>
          <span>Track the places your books have been.</span>
        </div>
      </footer>
    </div>
  )
}
