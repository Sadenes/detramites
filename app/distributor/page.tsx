"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DistributorPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/distributor/dashboard")
  }, [router])

  return null
}
