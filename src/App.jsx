import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AppRouter from '@/router/AppRouter'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'
import OfflineIndicator from '@/components/OfflineIndicator'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <PWAUpdatePrompt />
        <OfflineIndicator />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  )
}
