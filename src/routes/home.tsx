// src/routes/home.tsx
// Placeholder home page — protected route (requires auth)
// Full implementation in Phase 1 Plan 04
import { useAuthStore } from '@/stores/authStore'

export function Component() {
  const isAnonymous = useAuthStore((s) => s.isAnonymous)
  const user = useAuthStore((s) => s.user)

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center">
      <header className="absolute top-4 right-4">
        {isAnonymous ? (
          <span className="bg-surface text-text-secondary text-xs px-2 py-1 rounded-full border border-border">
            Guest Mode
          </span>
        ) : (
          <span className="text-text-secondary text-sm">{user?.email}</span>
        )}
      </header>
      <h1 className="font-display text-4xl text-accent mb-4">Skull King</h1>
      <p className="text-text-secondary">Game loading… coming soon</p>
    </main>
  )
}
