import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { planId } = await request.json()
    
    const response = await fetch('https://api-m.paypal.com/v1/billing/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: "ThumbRocket",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`
        }
      })
    })

    const data = await response.json()
    return NextResponse.json({ id: data.id })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}