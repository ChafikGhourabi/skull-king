// src/routes/home.tsx
// Full implementation of the /home branded placeholder page (Phase 1 Plan 04)
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { GuestBadge } from '@/components/auth/GuestBadge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function Component() {
  const isAnonymous = useAuthStore((s) => s.isAnonymous)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Trim email to display name (username part before @)
  const displayName = user?.email ? user.email.split('@')[0] : null

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav bar: sticky, 56px, bg-surface, bottom border */}
      <header className="sticky top-0 z-50 h-14 bg-surface border-b border-border shadow-sm flex items-center justify-between px-6">
        {/* Left: wordmark */}
        <span className="font-display text-accent text-xl font-bold">
          Skull King
        </span>

        {/* Right: guest badge or authenticated user info */}
        <div className="flex items-center gap-3">
          {isAnonymous ? (
            <GuestBadge />
          ) : (
            <>
              <span className="text-text-secondary text-sm">
                {displayName ?? user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-text-secondary text-xs"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="font-display text-accent text-4xl font-bold text-center">
          Skull King
        </h1>
        <p className="text-text-secondary font-body text-center">
          Rule the seas. One trick at a time.
        </p>
        <p className="text-text-muted text-sm text-center">
          Game loading… coming soon
        </p>
      </main>
    </div>
  )
}
