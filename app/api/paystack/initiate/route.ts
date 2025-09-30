import { NextRequest, NextResponse } from 'next/server'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_CURRENCY = process.env.PAYSTACK_CURRENCY || 'KES'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const USD_AMOUNTS: Record<'weekly' | 'yearly', number> = {
  weekly: 4,
  yearly: 67,
}

const USD_TO_KES_RATE = 150

const getAmountInKES = (usdAmount: number) => {
  return Math.round(usdAmount * USD_TO_KES_RATE * 100)
}

export async function POST(req: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 })
    }

    const body = await req.json()
    const { plan, email, userId } = body as { plan: 'weekly' | 'yearly'; email: string; userId: string }
    if (!plan || !email || !userId) {
      return NextResponse.json({ error: 'Missing plan, email or userId' }, { status: 400 })
    }

    const usdAmount = USD_AMOUNTS[plan]
    if (!usdAmount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const amount = getAmountInKES(usdAmount)

    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount,
        currency: PAYSTACK_CURRENCY,
        callback_url: `${SITE_URL}/pricing/success`,
        metadata: {
          user_id: userId,
          plan,
          usdAmount,
        },
      })
    })

    const data = await initRes.json()
    if (!initRes.ok) {
      return NextResponse.json({ error: data?.message || 'Paystack initialize failed' }, { status: 400 })
    }

    const authorization_url = data?.data?.authorization_url
    if (!authorization_url) {
      return NextResponse.json({ error: 'Missing authorization_url' }, { status: 400 })
    }

    return NextResponse.json({ authorization_url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to start payment' }, { status: 500 })
  }
}
