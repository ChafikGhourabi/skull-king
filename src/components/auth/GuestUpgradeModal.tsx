// src/components/auth/GuestUpgradeModal.tsx
// Inline account conversion dialog — shown post-game (D-10) to offer guest-to-permanent upgrade.
// Phase 4 will trigger this modal after the first game ends (D-09).
// In Phase 1, the Register screen (/auth/register) serves as the primary upgrade path.
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Zod schema for email/password upgrade form
const upgradeSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type UpgradeFormData = z.infer<typeof upgradeSchema>

interface GuestUpgradeModalProps {
  open: boolean
  onClose: () => void
}

export function GuestUpgradeModal({ open, onClose }: GuestUpgradeModalProps) {
  const [emailError, setEmailError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeSchema),
  })

  // PATH 1 — Email/password upgrade
  // Attaches email + password credentials to the existing anonymous session.
  // The same user_id is preserved automatically — D-18 atomicity guaranteed by Supabase.
  async function onSubmit(data: UpgradeFormData) {
    setEmailError(null)
    const { error } = await supabase.auth.updateUser({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setEmailError(error.message)
    } else {
      toast.success('Check your email to verify your account')
      onClose()
    }
  }

  // PATH 2 — Google OAuth upgrade
  // CRITICAL: Requires 'Manual Linking' enabled in Supabase Dashboard →
  // Authentication → Settings (T-1-05). Without this, linkIdentity will return an error.
  async function upgradeWithGoogle() {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` },
    })
    if (error) toast.error(error.message)
    // On success: Supabase redirects to /home with the linked identity
  }

  // Dismiss: soft dismiss — banner can be recalled next session
  // Banner does not re-appear until next session after dismissal (sk_upgrade_dismissed key)
  function handleDismiss() {
    localStorage.setItem('sk_upgrade_dismissed', 'true')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleDismiss() }}>
      <DialogContent showCloseButton={false} className="bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-accent text-lg">
            Save Your Progress
          </DialogTitle>
        </DialogHeader>

        <p className="text-text-secondary text-sm">
          Create a free account to keep your game history.
        </p>

        {/* PATH 1 — Email/password form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="upgrade-email" className="text-text-secondary text-xs">
              Email
            </Label>
            <Input
              id="upgrade-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
              className="bg-surface-inset border-border text-foreground placeholder:text-text-muted"
            />
            {errors.email && (
              <span className="text-danger-400 text-xs">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="upgrade-password" className="text-text-secondary text-xs">
              Password
            </Label>
            <Input
              id="upgrade-password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              {...register('password')}
              className="bg-surface-inset border-border text-foreground placeholder:text-text-muted"
            />
            {errors.password && (
              <span className="text-danger-400 text-xs">{errors.password.message}</span>
            )}
          </div>

          {/* Inline error alert for API-level errors */}
          {emailError && (
            <div className="bg-destructive-subtle border border-destructive/30 rounded-md px-3 py-2 text-xs text-foreground">
              {emailError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground hover:bg-accent-hover"
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        {/* Divider between upgrade paths */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 border-t border-border" />
          <span className="text-text-muted text-xs">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* PATH 2 — Google OAuth upgrade */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-surface-elevated border-border text-foreground hover:bg-muted"
          onClick={upgradeWithGoogle}
        >
          {/* Google G icon — inline SVG for zero-dependency branding */}
          <svg
            className="w-4 h-4 mr-2 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Dismiss button */}
        <Button
          type="button"
          variant="ghost"
          className="w-full text-text-muted text-sm"
          onClick={handleDismiss}
        >
          Maybe later
        </Button>
      </DialogContent>
    </Dialog>
  )
}
