// app/api/confirm-paypal-subscription/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { subscriptionID } = await request.json()
    
    // Get the current user from the session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.user.id // ← Now userId is defined!

    // Verify subscription with PayPal
    const response = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionID}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString('base64')}`
      }
    })

    const subscription = await response.json()
    
    if (subscription.status === 'ACTIVE') {
      // Update user in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          paypal_subscription_id: subscriptionID,
          subscription_status: 'active',
          current_period_end: new Date(subscription.billing_info.next_billing_time)
        })
        .eq('id', userId) // ← Now this works!

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to confirm subscription' }, { status: 500 })
  }
}