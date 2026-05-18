// src/routes/auth/register.tsx
// /auth/register route — email/password sign-up + guest account upgrade path (AUTH-07).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match — try again",
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function Component() {
  const navigate = useNavigate()
  const isAnonymous = useAuthStore((s) => s.isAnonymous)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  async function onSubmit(data: FormData) {
    setApiError(null)

    if (isAnonymous) {
      // Guest upgrade path — convert anonymous user to permanent account (AUTH-07)
      // Same user_id is preserved through the upgrade
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(error.message)
        setApiError(error.message)
        return
      }
      toast.success('Check your email to verify your account')
      navigate('/auth/verify')
      return
    }

    // New account sign-up path
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message)
      setApiError(error.message)
      return
    }
    navigate(`/auth/verify?email=${encodeURIComponent(data.email)}`)
  }

  return (
    <AuthLayout title="Join the Crew">
      {/* API error banner */}
      {apiError && (
        <div
          className="flex items-center gap-2 rounded-md border border-destructive bg-destructive-subtle p-3 mb-4"
          role="alert"
        >
          <AlertCircle size={16} className="text-destructive shrink-0" aria-hidden="true" />
          <p className="text-sm text-destructive-text">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email field */}
        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email address</Label>
          <Input
            id="register-email"
            type="email"
            autoFocus
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            className={cn(errors.email && 'border-destructive')}
            {...register('email')}
          />
          {errors.email && (
            <p id="register-email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby="register-password-hint register-password-error"
              className={cn('pr-10', errors.password && 'border-destructive')}
              {...register('password')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p id="register-password-hint" className="text-sm text-text-muted">
            At least 8 characters
          </p>
          {errors.password && (
            <p id="register-password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm password field */}
        <div className="space-y-1.5">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <div className="relative">
            <Input
              id="register-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={errors.confirmPassword ? 'true' : undefined}
              aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
              className={cn('pr-10', errors.confirmPassword && 'border-destructive')}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="register-confirm-error" className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Create Account button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          aria-label="Create your account"
        >
          {isSubmitting ? (
            <span
              className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Terms copy */}
        <p className="text-sm text-text-muted text-center">
          By joining, you agree to our Terms of Service
        </p>
      </form>

      {/* Nav link below the card */}
      <div className="mt-6 text-center text-sm">
        <Link
          to="/auth/login"
          className="text-accent hover:text-accent-hover underline-offset-4 hover:underline"
        >
          Already sailing? Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
