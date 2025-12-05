import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/components/theme-provider"
import { CheckServiceProvider } from "@/context/CheckServiceContext"

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CheckServiceProvider>
              {children}
            </CheckServiceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
