// Razorpay Webhook Handler — CAPortal
// Receives payment.captured events from Razorpay and activates CA plan in Supabase
//
// Deploy: npx supabase functions deploy razorpay-webhook --no-verify-jwt
// Secrets: npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_secret

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Plan mapping (amount in rupees → plan id) ──────────────────────────────
const PLAN_BY_AMOUNT: Record<number, string> = {
  799:  'starter',
  1799: 'pro',
  3499: 'firm',
}

// ── Verify Razorpay HMAC-SHA256 signature ─────────────────────────────────
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const mac    = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const digest = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  return digest === signature
}

// ── Main handler ───────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body      = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  const secret    = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''

  // Reject if secret not configured
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Verify signature
  const valid = await verifySignature(body, signature, secret)
  if (!valid) {
    console.warn('Invalid Razorpay signature')
    return new Response('Invalid signature', { status: 400 })
  }

  // Parse event
  let event: Record<string, unknown>
  try {
    event = JSON.parse(body)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const eventName = event.event as string
  console.log('Razorpay event:', eventName)

  // Only handle payment.captured
  if (eventName !== 'payment.captured') {
    return new Response('Ignored', { status: 200 })
  }

  const payment = (event.payload as Record<string, unknown>)
    ?.payment as Record<string, unknown>
  const entity  = payment?.entity as Record<string, unknown>

  if (!entity) {
    return new Response('No payment entity', { status: 400 })
  }

  // Extract details — notes are set by our frontend when checkout opens
  const razorpayId = entity.id as string
  const amountPaise = entity.amount as number
  const amountRupees = Math.round(amountPaise / 100)
  const notes   = (entity.notes as Record<string, string>) ?? {}
  const caEmail = notes.caEmail || (entity.email as string) || ''
  const planId  = notes.planId  || PLAN_BY_AMOUNT[amountRupees] || ''

  if (!planId) {
    console.error('Could not determine plan from amount:', amountRupees)
    return new Response('Unknown plan amount', { status: 400 })
  }

  if (!caEmail) {
    console.error('No CA email in payment')
    return new Response('No CA email', { status: 400 })
  }

  // Init Supabase with service role (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Find CA user by email
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    console.error('Error listing users:', usersError.message)
    return new Response('Error fetching users', { status: 500 })
  }

  const caUser = users.find((u: Record<string, unknown>) => u.email === caEmail)
  if (!caUser) {
    console.error('No user found with email:', caEmail)
    return new Response('CA not found', { status: 404 })
  }

  // Calculate plan expiry (30 days from now)
  const planStart  = new Date()
  const planExpiry = new Date()
  planExpiry.setDate(planExpiry.getDate() + 30)

  // Update profile with new plan
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      plan:        planId,
      plan_expiry: planExpiry.toISOString(),
    })
    .eq('id', caUser.id)

  if (profileError) {
    console.error('Error updating profile:', profileError.message)
    return new Response('Error activating plan', { status: 500 })
  }

  // Record the subscription payment
  const { error: paymentError } = await supabase
    .from('subscription_payments')
    .insert({
      ca_id:       caUser.id,
      ca_email:    caEmail,
      razorpay_id: razorpayId,
      plan:        planId,
      amount:      amountRupees,
      status:      'captured',
      plan_start:  planStart.toISOString(),
      plan_expiry: planExpiry.toISOString(),
    })

  if (paymentError && !paymentError.message.includes('duplicate')) {
    console.error('Error recording payment:', paymentError.message)
    // Don't fail — plan was already activated
  }

  console.log(`✓ Plan ${planId} activated for ${caEmail} until ${planExpiry.toISOString()}`)
  return new Response(JSON.stringify({ success: true, plan: planId, expiry: planExpiry }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
