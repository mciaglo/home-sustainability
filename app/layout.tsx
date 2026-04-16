import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LocaleProvider } from '@/lib/locale-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Verduurzaam je woning | Home Sustainability',
  description: 'Ontdek welke duurzame maatregelen het meest opleveren voor jouw woning — eerlijk, onafhankelijk, gratis.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className={inter.className}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
