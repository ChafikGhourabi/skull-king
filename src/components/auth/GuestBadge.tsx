// src/components/auth/GuestBadge.tsx
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

export function GuestBadge() {
  const isAnonymous = useAuthStore((s) => s.isAnonymous)
  const navigate = useNavigate()

  if (!isAnonymous) return null

  return (
    <div className="flex items-center gap-2">
      <span className="bg-accent-muted text-accent text-xs px-2 py-1 rounded-full font-body">
        Guest Mode
      </span>
      {/* In Phase 4+, this CTA will trigger GuestUpgradeModal after the first game ends (D-09) */}
      <Button
        variant="ghost"
        size="sm"
        className="text-accent text-xs"
        onClick={() => navigate('/auth/register')}
      >
        Create account
      </Button>
    </div>
  )
}
