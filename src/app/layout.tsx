import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FreightRoll - Autonomous Orchestration',
  description: 'Facility Orchestration & Autonomous Handoffs - No Friction.',
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
