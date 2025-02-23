import { Suspense } from 'react'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
    title: 'sf toolbox',
    description: 'Salesforce development tools',
    icons: {
        icon: [
            {
                url: '/icon_128.ico',
                sizes: '128x128',
            },
            {
                url: '/icon_128.png',
                sizes: '128x128',
            },
        ],
        apple: {
            url: '/icon_128.png',
            sizes: '128x128',
        },
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
            <body className="min-h-screen bg-background font-sans antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Suspense fallback={
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    }>
                        {children}
                        <Toaster />
                    </Suspense>
                </ThemeProvider>
            </body>
        </html>
    )
}
