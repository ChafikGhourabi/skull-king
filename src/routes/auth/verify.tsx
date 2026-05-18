// src/routes/auth/verify.tsx
// /auth/verify route — check email CTA with 60-second resend cooldown.
// Email address is read from URL search params (?email=...) set by register.tsx.
import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/AuthLayout'

const RESEND_COOLDOWN_SECONDS = 60

export function Component() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [cooldown, setCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS)
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (!email || cooldown > 0 || isResending) return
    setIsResending(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    setIsResending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Verification email sent — check your inbox')
    startCooldown()
  }

  return (
    <AuthLayout title="Check Your Compass">
      <div className="text-center space-y-4">
        <p className="text-text-secondary text-sm leading-relaxed">
          A verification link has been sent to{' '}
          {email ? (
            <span className="text-text-primary font-medium">{email}</span>
          ) : (
            'your email address'
          )}
          . Follow it to confirm your account.
        </p>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending || !email}
          aria-label={
            cooldown > 0
              ? `Resend verification email — wait ${cooldown} seconds`
              : 'Resend verification email'
          }
        >
          {isResending ? (
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                aria-hidden="true"
              />
              Sending…
            </span>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : (
            'Resend verification email'
          )}
        </Button>

        <p className="text-sm">
          <Link
            to="/auth/register"
            className="text-accent hover:text-accent-hover underline-offset-4 hover:underline"
          >
            Wrong email address? Go back
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
