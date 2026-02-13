import type { Metadata } from 'next'
import { Lora, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ArchivesMenu } from '@/components/archives-menu'
import './globals.css'

const _lora = Lora({ subsets: ['latin'], variable: '--font-lora' })
const _playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'Dear Vio',
  description: 'A love letter advent calendar',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </head>
      <body className="font-sans antialiased">
        <ArchivesMenu />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
