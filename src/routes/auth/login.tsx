// src/routes/auth/login.tsx
// /auth/login route — email/password sign-in + Google OAuth.
// Anonymous session is guaranteed to exist by the time this renders (ensureAnonymousSession loader).
import { useState } from 'react'
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

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export function Component() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
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
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message)
      setApiError(error.message)
      return
    }
    // On success: onAuthStateChange fires → Zustand updates → router loader redirects to /home
    navigate('/home')
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/home',
      },
    })
    if (error) toast.error(error.message)
  }

  return (
    <AuthLayout title="Welcome Back, Captain">
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
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            type="email"
            autoFocus
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className={cn(errors.email && 'border-destructive')}
            {...register('email')}
          />
          {errors.email && (
            <p id="login-email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password field with show/hide toggle */}
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
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
          {errors.password && (
            <p id="login-password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Sign In button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          aria-label="Sign in to your account"
        >
          {isSubmitting ? (
            <span
              className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6 flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-3 text-sm text-text-muted">or</span>
        <div className="flex-grow border-t border-border" />
      </div>

      {/* Google OAuth button */}
      <Button
        type="button"
        variant="outline"
        className="w-full border-border bg-surface-elevated hover:border-border-gold"
        onClick={signInWithGoogle}
        aria-label="Continue with Google"
      >
        {/* Google "G" SVG icon */}
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 shrink-0"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      {/* Guest link */}
      <div className="mt-4 text-center">
        <Button
          type="button"
          variant="ghost"
          className="text-accent w-full"
          onClick={() => navigate('/home')}
          aria-label="Play as guest without creating an account"
        >
          Play as Guest — no account needed
        </Button>
      </div>

      {/* Nav links below the card */}
      <div className="mt-6 flex flex-col gap-2 text-center text-sm">
        <Link to="/auth/register" className="text-accent hover:text-accent-hover underline-offset-4 hover:underline">
          New to the crew? Join now
        </Link>
        <Link to="/auth/reset-password" className="text-accent hover:text-accent-hover underline-offset-4 hover:underline">
          Forgot your password?
        </Link>
      </div>
    </AuthLayout>
  )
}
