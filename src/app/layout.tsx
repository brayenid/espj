import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/providers/session-provider'
import NextTopLoader from 'nextjs-toploader'
import SyncManager from '@/components/SyncManager'
import OfflineStatus from '@/components/offline-status'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'SPJ Organisasi',
  description: 'E-SPJ Bagian Organisasi',
  manifest: '/manifest.json'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextTopLoader />
        <AuthProvider>
          <SyncManager />
          <OfflineStatus />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
