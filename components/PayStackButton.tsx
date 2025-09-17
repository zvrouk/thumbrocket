"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

type PlanType = "weekly" | "yearly"

export function PayStackButton({ plan, label }: { plan: PlanType; label: string }) {
  const [loading, setLoading] = useState(false)

  const startPayment = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email
      const userId = session?.user?.id
      if (!email || !userId) {
        alert('Please log in first.')
        return
      }
      const res = await fetch("/api/paystack/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to start payment")
      // Redirect to Paystack authorization URL
      window.location.href = data.authorization_url
    } catch (e: any) {
      alert(e?.message || "Payment failed to start")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={startPayment} disabled={loading} className="w-full">
      {loading ? "Redirecting..." : label}
    </Button>
  )
}
