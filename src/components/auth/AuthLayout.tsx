// src/components/auth/AuthLayout.tsx
// Shared layout wrapper for all auth screens — centered card on dark wood background.
// No nav bar — auth screens are nav-bar-free per UI-SPEC App Shell Contract.

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* App tagline above the card */}
        <p className="font-display text-2xl text-accent text-center mb-6">
          Rule the seas. One trick at a time.
        </p>

        {/* Auth card */}
        <div className="bg-surface border border-border rounded-lg p-8 shadow-md">
          <h1 className="font-display text-xl text-text-primary text-center mb-2">{title}</h1>
          {subtitle && (
            <p className="text-text-muted text-sm text-center mb-6">{subtitle}</p>
          )}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>
      </div>
    </main>
  )
}
