import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { router } from '@/router'
import { initAuthListener } from '@/stores/authStore'
import '@/styles/theme.css'

// Wire onAuthStateChange before first render — ensures auth state is ready
// before any route loader runs (D-03)
initAuthListener()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" />
  </StrictMode>,
)
