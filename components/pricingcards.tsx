// components/PricingCards.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PayPalSubscribeButton } from "./paypalsubscribebutton"

const plans = [
  {
    id: 'weekly',
    name: "Weekly",
    price: "$5",
    description: "Perfect for trying out the tool",
    features: ["10 AI thumbnails per week", "All styles included", "Cancel anytime"]
  },
  {
    id: 'yearly',
    name: "Yearly", 
    price: "$199",
    description: "Best value - save 20%",
    features: ["Unlimited thumbnails", "Priority generation", "All future features"]
  }
]

export function PricingCards() {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <Card key={plan.id} className="text-center">
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <p className="text-4xl font-bold">{plan.price}</p>
            <p className="text-gray-600">{plan.description}</p>
          </CardHeader>
          <CardContent>
            <ul className="text-left mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <PayPalSubscribeButton planType={plan.id as 'weekly' | 'yearly'} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}