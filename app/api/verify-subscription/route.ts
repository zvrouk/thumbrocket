import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

async function verifyWithPaystack(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Failed to verify transaction')
  return data?.data
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 })
    }

    if (!reference) {
      return NextResponse.json({ error: 'reference is required' }, { status: 400 })
    }

    const v = await verifyWithPaystack(reference)
    if (v?.status !== 'success') {
      return NextResponse.json({ status: 'inactive' })
    }

    const plan = v?.metadata?.plan as 'weekly' | 'yearly' | undefined
    const userId = v?.metadata?.user_id as string | undefined
    if (!plan || !userId) return NextResponse.json({ status: 'inactive' })

    const now = new Date()
    const end = new Date(now)
    if (plan === 'weekly') end.setDate(end.getDate() + 7)
    else end.setDate(end.getDate() + 365)

    const supabase = getSupabaseAdmin()

    await supabase.from('profiles').upsert({
      id: userId,
      subscription_status: 'active',
      subscription_plan: plan,
      paystack_reference: reference,
      current_period_end: end.toISOString(),
    })

    return NextResponse.json({ status: 'active', current_period_end: end.toISOString(), plan })
  } catch (e: any) {
    const message = e?.message || 'Verify error'
    if (message.includes('Supabase admin client missing envs')) {
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
