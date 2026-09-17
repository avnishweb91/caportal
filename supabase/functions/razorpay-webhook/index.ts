import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLAN_BY_AMOUNT: Record<number, string> = { 79900: 'starter', 179900: 'pro', 349900: 'firm' }

async function getRazorpayOrder(orderId: string) {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID') ?? ''
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''
  if (!keyId || !keySecret) throw new Error('Razorpay API credentials are not configured')
  const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
  })
  const order = await response.json()
  if (!response.ok) throw new Error('Could not verify Razorpay order')
  return order
}

async function hmac(body: string, secret: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''
  if (!secret) return new Response('Webhook secret not configured', { status: 500 })

  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  if (!constantTimeEqual(await hmac(body, secret), signature)) return new Response('Invalid signature', { status: 400 })

  let event: any
  try { event = JSON.parse(body) } catch { return new Response('Invalid JSON', { status: 400 }) }
  if (event.event !== 'payment.captured') return new Response('Ignored', { status: 200 })
  const payment = event.payload?.payment?.entity
  if (!payment?.id || payment.status !== 'captured' || payment.currency !== 'INR') {
    return new Response('Invalid payment entity', { status: 400 })
  }

  const amount = Number(payment.amount)
  const amountPlan = PLAN_BY_AMOUNT[amount]
  if (!payment.order_id) return new Response('Payment is missing an order', { status: 400 })
  let order: any
  try { order = await getRazorpayOrder(payment.order_id) }
  catch (error) { console.error(error); return new Response('Could not verify payment order', { status: 502 }) }
  const notes = order.notes ?? {}
  const plan = notes.planId
  if (order.amount !== amount || order.currency !== 'INR' || order.status !== 'paid') {
    return new Response('Razorpay order does not match captured payment', { status: 400 })
  }
  if (!amountPlan || plan !== amountPlan) return new Response('Payment amount does not match plan', { status: 400 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )
  const caUserId = notes.caUserId
  let caId = typeof caUserId === 'string' ? caUserId : ''
  let caEmail = typeof notes.caEmail === 'string' ? notes.caEmail.toLowerCase() : ''

  if (caId) {
    const { data, error } = await supabase.auth.admin.getUserById(caId)
    if (error || !data.user) return new Response('CA account not found', { status: 404 })
    caEmail = (data.user.email || '').toLowerCase()
  } else if (caEmail) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) return new Response('Error fetching users', { status: 500 })
    const user = users.find((item: any) => item.email?.toLowerCase() === caEmail)
    if (!user) return new Response('CA account not found', { status: 404 })
    caId = user.id
    caEmail = (user.email || caEmail).toLowerCase()
  } else return new Response('No CA account on payment', { status: 400 })

  const { data: priorPayment, error: lookupError } = await supabase
    .from('subscription_payments').select('ca_id,plan,plan_expiry').eq('razorpay_id', payment.id).maybeSingle()
  if (lookupError) return new Response('Could not check payment record', { status: 500 })
  if (priorPayment) {
    const { error: retryError } = await supabase.from('profiles').update({
      plan: priorPayment.plan, plan_expiry: priorPayment.plan_expiry,
    }).eq('id', priorPayment.ca_id)
    if (retryError) return new Response('Could not activate plan', { status: 500 })
    return new Response(JSON.stringify({ success: true, duplicate: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = new Date()
  const expiry = new Date(now)
  expiry.setDate(expiry.getDate() + 30)
  const { error: recordError } = await supabase.from('subscription_payments').insert({
    ca_id: caId,
    ca_email: caEmail,
    razorpay_id: payment.id,
    plan,
    amount: amount / 100,
    currency: 'INR',
    status: 'captured',
    plan_start: now.toISOString(),
    plan_expiry: expiry.toISOString(),
  })
  if (recordError) return new Response('Could not record payment', { status: 500 })

  const { error: profileError } = await supabase.from('profiles').update({
    plan,
    plan_expiry: expiry.toISOString(),
  }).eq('id', caId)
  if (profileError) {
    console.error('Subscription plan activation failed after payment record', profileError.message)
    return new Response('Could not activate plan', { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, plan, expiry: expiry.toISOString() }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
})
