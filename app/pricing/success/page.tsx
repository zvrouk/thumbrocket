"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const search = useSearchParams()
  const [message, setMessage] = useState("Finalizing your subscription...")

  useEffect(() => {
    const finalize = async () => {
      const ref = search.get("reference")
      // Ensure user logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace("/login")
        return
      }
      try {
        const res = await fetch(`/api/verify-subscription${ref ? `?reference=${encodeURIComponent(ref)}` : ''}`)
        const data = await res.json()
        if (res.ok && data?.status === 'active') {
          setMessage("Subscription active! Redirecting...")
          setTimeout(() => router.replace("/"), 1200)
        } else {
          setMessage("We couldn't verify your subscription yet. You can retry or contact support.")
        }
      } catch {
        setMessage("Verification error. Please try again.")
      }
    }
    finalize()
  }, [router, search])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <p className="text-gray-700">{message}</p>
    </div>
  )
}

