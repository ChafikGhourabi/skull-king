// src/router/index.tsx
import { createBrowserRouter, redirect } from 'react-router'
import { supabase } from '@/lib/supabase'

// Requires an active session — redirects to /auth/login if none (AUTH-04)
async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw redirect('/auth/login')
  return session
}

// Redirects already-authenticated non-anonymous users away from auth screens (AUTH-06).
// Anonymous/guest sessions are allowed through — they need to reach login/register to upgrade.
async function redirectIfAuthed() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session && !session.user.is_anonymous) throw redirect('/home')
  return null
}


export const router = createBrowserRouter([
  {
    // Root — redirect based on session state (D-03)
    path: '/',
    loader: () =>
      supabase.auth.getSession().then(({ data: { session } }) =>
        session ? redirect('/home') : redirect('/auth/login')
      ),
  },
  {
    // Protected layout — all children require auth
    loader: requireAuth,
    children: [{ path: '/home', lazy: () => import('@/routes/home') }],
  },
  {
    // Auth layout — redirects already-authed users away (D-02)
    path: '/auth',
    loader: redirectIfAuthed,
    children: [
      {
        path: 'login',
        lazy: () => import('@/routes/auth/login'),
      },
      { path: 'register', lazy: () => import('@/routes/auth/register') },
      { path: 'verify', lazy: () => import('@/routes/auth/verify') },
      { path: 'reset-password', lazy: () => import('@/routes/auth/reset-password') },
    ],
  },
  // /auth/verified does NOT redirect authed users — it IS the post-auth landing (D-04)
  { path: '/auth/verified', lazy: () => import('@/routes/auth/verified') },
])
