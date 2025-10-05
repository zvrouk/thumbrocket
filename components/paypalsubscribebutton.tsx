// components/PayPalSubscribeButton.tsx
"use client"

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { Button } from "@/components/ui/button"

const initialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
  currency: "USD",
  intent: "subscription",
}

const plans = {
  weekly: {
    plan_id: "Q4PXW2JPAUDLG", // You'll get this from PayPal
    name: "Weekly Plan",
    price: "$5/week"
  },
  yearly: {
    plan_id: "P-YYYYYYYYYYYYYYYYYYYYYYYY", // You'll get this from PayPal
    name: "Yearly Plan", 
    price: "$199/year"
  }
}

export function PayPalSubscribeButton({ planType }: { planType: 'weekly' | 'yearly' }) {
  const createSubscription = async () => {
    const response = await fetch('/api/create-paypal-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plans[planType].plan_id })
    })
    return response.json()
  }

  const onApprove = async (data: any) => {
    // This will be called after successful payment
    const response = await fetch('/api/confirm-paypal-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionID: data.subscriptionID })
    })
    
    if (response.ok) {
      alert('Subscription activated!')
      window.location.reload()
    }
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        style={{ layout: "vertical", label: "subscribe" }}
        createSubscription={createSubscription}
        onApprove={onApprove}
      />
    </PayPalScriptProvider>
  )
}