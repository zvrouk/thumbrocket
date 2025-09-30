"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PayStackButton } from "@/components/PayStackButton"
import { supabase } from "@/lib/supabaseClient"

const plans: Array<{
  id: "weekly" | "yearly"
  name: string
  price: string
  frequency: string
  description: string
  originalPrice?: string
  features: string[]
}> = [
  {
    id: "weekly",
    name: "Weekly",
    price: "$4",
    frequency: "/week",
    description: "Perfect for trying out the tool",
    originalPrice: "KSh 600",
    features: [
      "10 AI thumbnails per week",
      "All styles included",
      "Cancel anytime",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$67",
    frequency: "/year",
    description: "Best value - save 20%",
    originalPrice: "KSh 10,050",
    features: [
      "Unlimited thumbnails",
      "Priority generation",
      "All future features",
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()

  useEffect(() => {
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
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-base font-normal">{plan.frequency}</span>
                </div>
                {plan.originalPrice && (
                  <div className="text-sm text-gray-500">Charged as {plan.originalPrice}</div>
                )}
                <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <PayStackButton plan={plan.id} label={`Subscribe - ${plan.price}`} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
