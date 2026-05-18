// src/routes/auth/reset-password.tsx
// /auth/reset-password route — two modes:
//   Mode A (initial): email input → sends reset link via resetPasswordForEmail
//   Mode B (PASSWORD_RECOVERY event active): new password form → calls updateUser
//
// Security: Mode A ALWAYS shows "Link Sent" success state regardless of API response —
// this prevents leaking whether an email address is registered (T-AUTH-01).
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { cn } from '@/lib/utils'

// Mode A schema — just email
const requestSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type RequestFormData = z.infer<typeof requestSchema>

// Mode B schema — new password + confirm
const newPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords don't match — try again",
    path: ['confirmNewPassword'],
  })
type NewPasswordFormData = z.infer<typeof newPasswordSchema>

export function Component() {
  const navigate = useNavigate()
  // isRecoveryMode: true when PASSWORD_RECOVERY event detected via onAuthStateChange
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  // linkSent: true after Mode A submit — shows success state regardless of API response
  const [linkSent, setLinkSent] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Listen for PASSWORD_RECOVERY event to activate Mode B (T-AUTH-02)
  // Mode B only activates on this auth event — cannot be triggered by URL manipulation
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Mode A form
  const requestForm = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    mode: 'onBlur',
  })

  // Mode B form
  const newPasswordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    mode: 'onBlur',
  })

  // Mode A: send reset email
  async function onRequestSubmit(data: RequestFormData) {
    setApiError(null)
    // Fire-and-forget — we ALWAYS show success to avoid confirming email existence (T-AUTH-01)
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: window.location.origin + '/auth/reset-password',
    })
    // Intentionally NOT checking error — always show "Link Sent" success state
    setLinkSent(true)
  }

  // Mode B: update password
  async function onNewPasswordSubmit(data: NewPasswordFormData) {
    setApiError(null)
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    })
    if (error) {
      toast.error(error.message)
      setApiError(error.message)
      return
    }
    toast.success('Password updated — welcome back, Captain')
    navigate('/home')
  }

  // Mode A — "Link Sent" success state
  if (linkSent) {
    return (
      <AuthLayout title="Check Your Inbox">
        <div className="text-center space-y-4">
          <p className="text-text-secondary text-sm leading-relaxed">
            If an account exists for that email address, you'll receive a password reset link
            shortly.
          </p>
          <Link
            to="/auth/login"
            className="block text-sm text-accent hover:text-accent-hover underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // Mode B — new password form (PASSWORD_RECOVERY event active)
  if (isRecoveryMode) {
    return (
      <AuthLayout title="Set a New Password">
        {apiError && (
          <div
            className="flex items-center gap-2 rounded-md border border-destructive bg-destructive-subtle p-3 mb-4"
            role="alert"
          >
            <AlertCircle size={16} className="text-destructive shrink-0" aria-hidden="true" />
            <p className="text-sm text-destructive-text">{apiError}</p>
          </div>
        )}

        <form
          onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)}
          noValidate
          className="space-y-4"
        >
          {/* New password field */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoFocus
                autoComplete="new-password"
                aria-invalid={newPasswordForm.formState.errors.newPassword ? 'true' : undefined}
                aria-describedby="new-password-hint new-password-error"
                className={cn(
                  'pr-10',
                  newPasswordForm.formState.errors.newPassword && 'border-destructive'
                )}
                {...newPasswordForm.register('newPassword')}
              />
              <button
                type="button"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p id="new-password-hint" className="text-sm text-text-muted">
              At least 8 characters
            </p>
            {newPasswordForm.formState.errors.newPassword && (
              <p id="new-password-error" className="text-sm text-destructive">
                {newPasswordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm new password field */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-new-password">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                aria-invalid={
                  newPasswordForm.formState.errors.confirmNewPassword ? 'true' : undefined
                }
                aria-describedby={
                  newPasswordForm.formState.errors.confirmNewPassword
                    ? 'confirm-new-password-error'
                    : undefined
                }
                className={cn(
                  'pr-10',
                  newPasswordForm.formState.errors.confirmNewPassword && 'border-destructive'
                )}
                {...newPasswordForm.register('confirmNewPassword')}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {newPasswordForm.formState.errors.confirmNewPassword && (
              <p id="confirm-new-password-error" className="text-sm text-destructive">
                {newPasswordForm.formState.errors.confirmNewPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={newPasswordForm.formState.isSubmitting}
            aria-label="Update your password"
          >
            {newPasswordForm.formState.isSubmitting ? (
              <span
                className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                aria-hidden="true"
              />
            ) : (
              'Update Password'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link
            to="/auth/login"
            className="text-accent hover:text-accent-hover underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // Mode A — initial email request form
  return (
    <AuthLayout
      title="Reset Your Course"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {apiError && (
        <div
          className="flex items-center gap-2 rounded-md border border-destructive bg-destructive-subtle p-3 mb-4"
          role="alert"
        >
          <AlertCircle size={16} className="text-destructive shrink-0" aria-hidden="true" />
          <p className="text-sm text-destructive-text">{apiError}</p>
        </div>
      )}

      <form
        onSubmit={requestForm.handleSubmit(onRequestSubmit)}
        noValidate
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="reset-email">Email address</Label>
          <Input
            id="reset-email"
            type="email"
            autoFocus
            autoComplete="email"
            aria-invalid={requestForm.formState.errors.email ? 'true' : undefined}
            aria-describedby={
              requestForm.formState.errors.email ? 'reset-email-error' : undefined
            }
            className={cn(requestForm.formState.errors.email && 'border-destructive')}
            {...requestForm.register('email')}
          />
          {requestForm.formState.errors.email && (
            <p id="reset-email-error" className="text-sm text-destructive">
              {requestForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={requestForm.formState.isSubmitting}
          aria-label="Send password reset link"
        >
          {requestForm.formState.isSubmitting ? (
            <span
              className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link
          to="/auth/login"
          className="text-accent hover:text-accent-hover underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
