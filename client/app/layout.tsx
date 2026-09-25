import type { Metadata } from 'next'
import './globals.css'
import './jobs/jobs-dark-mode.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MobileNav } from '@/components/mobile-nav'

export const metadata: Metadata = {
  title: 'DevHeaven — Where developers build momentum',
  description: 'Connect, share your work, and find the opportunities that move your developer career forward.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="pb-20 md:pb-0">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <AuthProvider>
              {children}
              <MobileNav />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
