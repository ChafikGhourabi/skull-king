// src/stores/authStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAnonymous: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  session: null,
  isLoading: true,
  isAnonymous: false,
}))

// Call once from main.tsx before first render — wires onAuthStateChange before any route loader runs (D-03)
export function initAuthListener() {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.setState({
      session,
      user: session?.user ?? null,
      isAnonymous: session?.user?.is_anonymous ?? false,
      isLoading: false,
    })
  })

  return supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({
      session,
      user: session?.user ?? null,
      isAnonymous: session?.user?.is_anonymous ?? false,
      isLoading: false,
    })
  })
}
