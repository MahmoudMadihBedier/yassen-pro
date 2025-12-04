'use client'

import { useAuth } from "@/context/AuthContext"
import BouncedCheckManager from "@/components/BouncedCheckManager"
import LoginPage from "@/components/LoginPage"

export default function Home() {
  const { user } = useAuth()

  if (!user) {
    return <LoginPage />
  }

  return <BouncedCheckManager />
}
