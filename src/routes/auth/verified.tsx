// src/routes/auth/verified.tsx
// Post-email-verification landing — auto-redirects to /home after 3 seconds (D-04).
// No redirectIfAuthed loader on this route — it IS the post-auth landing page.
// detectSessionInUrl: true in the Supabase client means the session is already exchanged
// by the time this component mounts — no manual token exchange needed.
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export function Component() {
  const navigate = useNavigate()

  useEffect(() => {
    // 3-second delay before redirecting to /home (D-04 — Claude's discretion)
    const timer = setTimeout(() => navigate('/home'), 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <h1 className="font-display text-accent text-3xl text-center">Email Confirmed!</h1>
      <p className="text-text-secondary text-center">Redirecting you to the game…</p>
    </main>
  )
}
