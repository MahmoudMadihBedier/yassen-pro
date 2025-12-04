import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Bounced Check Manager",
  description: "Track and manage bounced checks with automated follow-ups",
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
