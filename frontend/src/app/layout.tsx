import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project Genesis - Yard Builder AI',
  description: 'Genesis accelerates adoption with intelligent yard management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
