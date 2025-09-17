"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PayStackButton } from "@/components/PayStackButton"
import { supabase } from "@/lib/supabaseClient"

export default function PricingPage() {
  const router = useRouter()

  useEffect(() => {
    // Require login before purchasing
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) router.replace("/login")
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600">Unlock the AI Thumbnail Generator</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$4<span className="text-base font-normal">/week</span></div>
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Full access to generator</li>
                <li>Great for quick projects</li>
              </ul>
              <PayStackButton plan="weekly" label="Start Weekly Plan" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yearly</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$67<span className="text-base font-normal">/year</span></div>
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Best value</li>
                <li>Unlimited access</li>
              </ul>
              <PayStackButton plan="yearly" label="Start Yearly Plan" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

