export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background via-muted/20 to-muted/50 px-4 py-12">
      {children}
    </div>
  )
}
