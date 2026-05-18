// src/routes/auth/verified.tsx
// Post-email-verification landing — auto-redirects to /home after 3s (D-04)
// No redirectIfAuthed loader — this IS the post-auth landing page
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export function Component() {
  const navigate = useNavigate()

  useEffect(() => {
    // 3-second delay before redirecting to /home (Claude's discretion — D-04)
    const timer = setTimeout(() => navigate('/home'), 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center">
      <h1 className="font-display text-4xl text-accent mb-4">Email Confirmed!</h1>
      <p className="text-text-secondary">Redirecting you to the game…</p>
    </main>
  )
}
