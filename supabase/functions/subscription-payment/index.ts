import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLANS: Record<string, { amount: number }> = {
  starter: { amount: 79900 },
  pro: { amount: 179900 },
  firm: { amount: 349900 },
}
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
})

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let index = 0; index < a.length; index++) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return mismatch === 0
}

async function razorpay(path: string, init: RequestInit = {}) {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID') ?? ''
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''
  if (!keyId || !keySecret) throw new Error('Razorpay server credentials are not configured')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Basic ${btoa(`${keyId}:${keySecret}`)}`)
  headers.set('Content-Type', 'application/json')
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    ...init,
    headers,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.description || 'Razorpay request failed')
  return result
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  const anon = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
  })
  const { data: { user }, error: authError } = await anon.auth.getUser()
  if (authError || !user) return json({ error: 'Sign in is required' }, 401)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  try {
    const body = await req.json()
    if (body.action === 'create_order') {
      const plan = PLANS[String(body.planId)]
      if (!plan) return json({ error: 'Unknown subscription plan' }, 400)
      const order = await razorpay('orders', {
        method: 'POST',
        body: JSON.stringify({
          amount: plan.amount,
          currency: 'INR',
          receipt: `ca_${user.id}_${crypto.randomUUID().slice(0, 8)}`,
          notes: { caUserId: user.id, planId: String(body.planId) },
        }),
      })
      return json({ orderId: order.id, amount: plan.amount, currency: 'INR', keyId: Deno.env.get('RAZORPAY_KEY_ID') })
    }

    if (body.action === 'verify_payment') {
      const { orderId, paymentId, signature } = body
      if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') {
        return json({ error: 'Payment verification details are incomplete' }, 400)
      }
      const expectedSignature = await hmac(`${orderId}|${paymentId}`, Deno.env.get('RAZORPAY_KEY_SECRET') ?? '')
      if (!constantTimeEqual(expectedSignature, signature)) return json({ error: 'Invalid payment signature' }, 400)

      const order = await razorpay(`orders/${encodeURIComponent(orderId)}`)
      const notes = order.notes || {}
      if (notes.caUserId !== user.id || !PLANS[notes.planId]) return json({ error: 'Payment order does not match this account' }, 403)
      const plan = PLANS[notes.planId]
      if (order.amount !== plan.amount || order.currency !== 'INR') return json({ error: 'Order amount does not match the selected plan' }, 400)

      const payment = await razorpay(`payments/${encodeURIComponent(paymentId)}`)
      if (payment.order_id !== orderId || payment.amount !== plan.amount || payment.currency !== 'INR' || payment.status !== 'captured') {
        return json({ error: 'Payment is not captured for the expected amount and order' }, 400)
      }

      const now = new Date()
      const expiry = new Date(now)
      expiry.setDate(expiry.getDate() + 30)
      const { data: insertedPayment, error: paymentError } = await admin.from('subscription_payments').upsert({
        ca_id: user.id,
        ca_email: user.email,
        razorpay_id: paymentId,
        plan: notes.planId,
        amount: plan.amount / 100,
        currency: 'INR',
        status: 'captured',
        plan_start: now.toISOString(),
        plan_expiry: expiry.toISOString(),
      }, { onConflict: 'razorpay_id', ignoreDuplicates: true }).select('ca_id,plan,plan_expiry').maybeSingle()
      if (paymentError) throw paymentError
      // A repeated valid checkout callback must not grant another 30 days.
      // With ignoreDuplicates, a concurrent/repeated insert returns no row.
      if (!insertedPayment) {
        const { data: existingPayment, error: existingError } = await admin.from('subscription_payments')
          .select('ca_id,plan,plan_expiry').eq('razorpay_id', paymentId).maybeSingle()
        if (existingError) throw existingError
        if (!existingPayment || existingPayment.ca_id !== user.id || existingPayment.plan !== notes.planId) {
          return json({ error: 'Payment was already recorded for a different account or plan' }, 409)
        }
        return json({ verified: true, plan: existingPayment.plan, paymentId, planExpiry: existingPayment.plan_expiry })
      }

      const { error: profileError } = await admin.from('profiles').update({
        plan: notes.planId,
        plan_expiry: expiry.toISOString(),
      }).eq('id', user.id)
      if (profileError) throw profileError
      return json({ verified: true, plan: notes.planId, paymentId, planExpiry: expiry.toISOString() })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('subscription-payment error', error)
    const message = error instanceof Error ? error.message : 'Payment request failed'
    return json({ error: message }, 500)
  }
})
