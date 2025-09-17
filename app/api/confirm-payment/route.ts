import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

function verifySignature(rawBody: string, headerSig: string | null) {
  if (!headerSig || !PAYSTACK_SECRET_KEY) return false
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')
  return hash === headerSig
}

async function verifyWithPaystack(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Failed to verify transaction')
  return data?.data
}

export async function POST(req: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 })
    }

    const rawBody = await req.text()
    const headerSig = req.headers.get('x-paystack-signature')
    const valid = verifySignature(rawBody, headerSig)
    if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

    const event = JSON.parse(rawBody)
    const reference = event?.data?.reference as string | undefined
    if (!reference) return NextResponse.json({ ok: true })

    const v = await verifyWithPaystack(reference)
    if (v?.status !== 'success') return NextResponse.json({ ok: true })

    const plan = v?.metadata?.plan as 'weekly' | 'yearly' | undefined
    const userId = v?.metadata?.user_id as string | undefined
    if (!plan || !userId) return NextResponse.json({ ok: true })

    const now = new Date()
    const end = new Date(now)
    if (plan === 'weekly') end.setDate(end.getDate() + 7)
    else end.setDate(end.getDate() + 365)

    // Update profile
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      subscription_status: 'active',
      subscription_plan: plan,
      paystack_reference: reference,
      current_period_end: end.toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Webhook error' }, { status: 500 })
  }
}

