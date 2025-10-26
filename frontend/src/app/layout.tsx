import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import OnboardingTour from '@/components/OnboardingTour'

export const metadata: Metadata = {
  title: 'AI Study Circle - Intelligent Content Analysis',
  description: 'AI-powered platform for generating summaries and exam papers from your content',
  keywords: ['AI', 'education', 'summary', 'exam', 'content analysis', 'study'],
  authors: [{ name: 'AI Study Circle Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <NotificationProvider>
            <OnboardingProvider>
              <div className="min-h-screen">
                {children}
                <OnboardingTour />
              </div>
            </OnboardingProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}