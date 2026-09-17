import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
})

const db = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
)

const selectClient = 'id,ca_id,name,phone,type,status,fee_amount,fee_paid,fee_payment_status,fee_payment_order_id,docs_total,docs_received,portal_token,data'

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
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Basic ${btoa(`${keyId}:${keySecret}`)}`)
  headers.set('Content-Type', 'application/json')
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, { ...init, headers })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.description || 'Razorpay request failed')
  return result
}

function portalView(row: any, profile: any = {}) {
  const data = row.data || {}
  return {
    id: row.id,
    portalToken: row.portal_token,
    name: row.name,
    phone: row.phone || '',
    type: row.type || 'ITR-1',
    status: row.status,
    feeAmount: row.fee_amount || 0,
    feePaid: !!row.fee_paid,
    feePaymentStatus: row.fee_payment_status || (row.fee_paid ? 'paid' : 'pending'),
    docsTotal: row.docs_total || 0,
    docsReceived: row.docs_received || 0,
    documents: data.documents || [],
    upiId: profile.upi_id || '',
    upiName: profile.upi_name || profile.firm_name || profile.name || 'Your CA',
    razorpayConfigured: !!profile.razorpay_route_account_id,
  }
}

async function findByToken(token: string) {
  if (!token || token.length > 200) return { row: null, error: 'Invalid portal token' }
  const { data: row, error } = await db.from('clients').select(selectClient).eq('portal_token', token).maybeSingle()
  return { row, error: error?.message || null }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const isMultipart = req.headers.get('content-type')?.includes('multipart/form-data') ?? false
    const form = isMultipart ? await req.formData() : null
    const body = form ? null : await req.json()
    const action = String(form?.get('action') ?? body?.action ?? '')
    const token = String(form?.get('token') ?? body?.token ?? '')
    const { row, error } = await findByToken(token)
    if (error) return json({ error }, 500)
    if (!row) return json({ error: 'Portal link is invalid or expired' }, 404)

    if (action === 'get') {
      const { data: profile } = await db.from('profiles').select('name,firm_name,upi_id,upi_name,razorpay_route_account_id').eq('id', row.ca_id).maybeSingle()
      return json({ client: portalView(row, profile || {}) })
    }

    if (action === 'create_fee_order') {
      if (row.fee_paid) return json({ error: 'This fee is already paid' }, 409)
      if (!(row.fee_amount > 0)) return json({ error: 'No fee is due for this client' }, 400)
      const { data: profile, error: profileError } = await db.from('profiles')
        .select('name,firm_name,razorpay_route_account_id').eq('id', row.ca_id).maybeSingle()
      if (profileError) return json({ error: 'Could not load CA payment settings' }, 500)
      const routeAccountId = profile?.razorpay_route_account_id || ''
      if (!/^acc_[A-Za-z0-9]+$/.test(routeAccountId)) {
        return json({ error: 'Your CA has not finished setting up Razorpay payments. Please contact them.' }, 409)
      }
      const amount = Math.round(Number(row.fee_amount) * 100)
      if (row.fee_payment_order_id) {
        try {
          const existingOrder = await razorpay(`orders/${encodeURIComponent(row.fee_payment_order_id)}`)
          const transfers = existingOrder.transfers || []
          const stillOpen = existingOrder.status === 'created'
            && existingOrder.notes?.purpose === 'client_fee'
            && existingOrder.notes?.clientId === String(row.id)
            && existingOrder.notes?.caId === row.ca_id
            && existingOrder.amount === amount
            && transfers.some((transfer: any) => transfer.account === routeAccountId && transfer.amount === amount && transfer.currency === 'INR')
          if (stillOpen) return json({ orderId: existingOrder.id, amount, currency: 'INR', keyId: Deno.env.get('RAZORPAY_KEY_ID') })
          if (existingOrder.status === 'paid') return json({ error: 'Payment is processing. Refresh the portal in a moment.' }, 409)
        } catch {
          // If the saved order no longer exists at Razorpay, create a new one.
        }
      }
      const order = await razorpay('orders', {
        method: 'POST',
        body: JSON.stringify({
          amount, currency: 'INR',
          receipt: `client_${row.id}_${crypto.randomUUID().slice(0, 8)}`,
          notes: { purpose: 'client_fee', clientId: String(row.id), caId: row.ca_id },
          transfers: [{
            account: routeAccountId, amount, currency: 'INR',
            notes: { clientId: String(row.id) },
          }],
        }),
      })
      let saveOrderQuery = db.from('clients').update({ fee_payment_order_id: order.id }).eq('id', row.id)
      saveOrderQuery = row.fee_payment_order_id
        ? saveOrderQuery.eq('fee_payment_order_id', row.fee_payment_order_id)
        : saveOrderQuery.is('fee_payment_order_id', null)
      const { data: savedOrder, error: orderSaveError } = await saveOrderQuery.select('fee_payment_order_id').maybeSingle()
      if (orderSaveError) return json({ error: 'Could not save checkout order. Please retry.' }, 500)
      if (!savedOrder) {
        const { data: winner, error: winnerError } = await db.from('clients')
          .select('fee_payment_order_id').eq('id', row.id).maybeSingle()
        if (winnerError || !winner?.fee_payment_order_id) return json({ error: 'Could not prepare checkout. Please retry.' }, 500)
        const winnerOrder = await razorpay(`orders/${encodeURIComponent(winner.fee_payment_order_id)}`)
        const winnerIsValid = winnerOrder.status === 'created'
          && winnerOrder.notes?.purpose === 'client_fee'
          && winnerOrder.notes?.clientId === String(row.id)
          && winnerOrder.notes?.caId === row.ca_id
          && winnerOrder.amount === amount
          && (winnerOrder.transfers || []).some((transfer: any) => transfer.account === routeAccountId && transfer.amount === amount && transfer.currency === 'INR')
        if (!winnerIsValid) return json({ error: 'Could not prepare checkout. Please retry.' }, 409)
        return json({ orderId: winnerOrder.id, amount, currency: 'INR', keyId: Deno.env.get('RAZORPAY_KEY_ID') })
      }
      return json({ orderId: order.id, amount, currency: 'INR', keyId: Deno.env.get('RAZORPAY_KEY_ID') })
    }

    if (action === 'verify_fee_payment') {
      const { orderId, paymentId, signature } = body || {}
      if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') {
        return json({ error: 'Payment verification details are incomplete' }, 400)
      }
      const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''
      if (!keySecret) return json({ error: 'Razorpay is not configured' }, 503)
      const expected = await hmac(`${orderId}|${paymentId}`, keySecret)
      if (!constantTimeEqual(expected, signature)) return json({ error: 'Invalid payment signature' }, 400)

      const order = await razorpay(`orders/${encodeURIComponent(orderId)}`)
      const amount = Math.round(Number(row.fee_amount) * 100)
      if (row.fee_payment_order_id !== orderId) return json({ error: 'This checkout order has expired. Start payment again from the portal.' }, 409)
      if (order.notes?.purpose !== 'client_fee' || order.notes?.clientId !== String(row.id)
        || order.notes?.caId !== row.ca_id || order.amount !== amount || order.currency !== 'INR') {
        return json({ error: 'Payment order does not match this client or fee amount' }, 400)
      }
      const { data: caProfile } = await db.from('profiles').select('razorpay_route_account_id').eq('id', row.ca_id).maybeSingle()
      const routedToCA = (order.transfers || []).some((transfer: any) =>
        transfer.account === caProfile?.razorpay_route_account_id && transfer.amount === amount && transfer.currency === 'INR')
      if (!routedToCA) return json({ error: 'This payment order is not routed to your CA account' }, 400)
      const payment = await razorpay(`payments/${encodeURIComponent(paymentId)}`)
      if (payment.order_id !== orderId || payment.amount !== amount || payment.currency !== 'INR' || payment.status !== 'captured') {
        return json({ error: 'Payment is not captured for the expected fee and order' }, 400)
      }
      if (row.fee_paid) {
        if (row.data?.feePaymentId !== paymentId) return json({ error: 'This fee is already marked paid' }, 409)
        const { data: existingProfile } = await db.from('profiles')
          .select('name,firm_name,upi_id,upi_name,razorpay_route_account_id').eq('id', row.ca_id).maybeSingle()
        return json({ verified: true, paymentId, client: portalView(row, existingProfile || {}) })
      }

      const data = row.data || {}
      const updatedData = {
        ...data, feePaid: true, feePaymentStatus: 'paid', feePaymentId: paymentId,
        timeline: [
          { action: `Professional fee paid via Razorpay (₹${row.fee_amount})`, time: new Date().toISOString(), type: 'green' },
          ...(data.timeline || []),
        ],
      }
      const { data: updated, error: updateError } = await db.from('clients').update({
        fee_paid: true, fee_payment_status: 'paid', data: updatedData,
      }).eq('id', row.id).eq('fee_paid', false).eq('fee_payment_order_id', orderId).select(selectClient).maybeSingle()
      if (updateError) return json({ error: 'Payment succeeded but the portal could not update. Contact your CA with your Razorpay payment ID.' }, 500)
      if (!updated) {
        const { data: latest } = await db.from('clients').select(selectClient).eq('id', row.id).maybeSingle()
        if (!latest?.fee_paid || latest.data?.feePaymentId !== paymentId) {
          return json({ error: 'This fee was marked paid by another payment. Contact your CA before paying again.' }, 409)
        }
        const { data: existingProfile } = await db.from('profiles')
          .select('name,firm_name,upi_id,upi_name,razorpay_route_account_id').eq('id', row.ca_id).maybeSingle()
        return json({ verified: true, paymentId, client: portalView(latest, existingProfile || {}) })
      }
      const { data: profile } = await db.from('profiles').select('name,firm_name,upi_id,upi_name,razorpay_route_account_id').eq('id', row.ca_id).maybeSingle()
      return json({ verified: true, paymentId, client: portalView(updated, profile || {}) })
    }

    if (action === 'report_payment') {
      if (row.fee_paid) return json({ client: portalView(row) })
      if (!(row.fee_amount > 0)) return json({ error: 'No fee is due for this client' }, 400)
      const data = row.data || {}
      const updatedData = {
        ...data,
        feePaymentStatus: 'reported',
        timeline: [
          { action: 'Client reported fee payment; CA confirmation required', time: new Date().toISOString(), type: 'amber' },
          ...(data.timeline || []),
        ],
      }
      const { data: updated, error: updateError } = await db.from('clients').update({
        fee_payment_status: 'reported', data: updatedData,
      }).eq('id', row.id).select(selectClient).single()
      if (updateError) return json({ error: updateError.message }, 500)
      return json({ client: portalView(updated) })
    }

    if (action === 'upload') {
      const file = form?.get('file')
      const docName = String(form?.get('docName') ?? '').trim()
      if (!(file instanceof File) || !docName) return json({ error: 'A document name and file are required' }, 400)
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) {
        return json({ error: 'Choose a PDF, JPG or PNG file up to 10 MB' }, 400)
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || ''
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) return json({ error: 'Unsupported file extension' }, 400)
      const safeName = (value: string) => value.replace(/[^a-z0-9._-]/gi, '_').toLowerCase().slice(0, 100)
      const path = `${row.ca_id}/${row.id}/${safeName(docName)}_${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await db.storage.from('ca-documents').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) return json({ error: uploadError.message }, 500)

      const data = row.data || {}
      const docs = data.documents || []
      const index = docs.findIndex((doc: any) => doc.name === docName)
      const fileInfo = { fileName: file.name, fileType: file.type, fileSize: file.size, fileUrl: path }
      const updatedDocs = [...docs]
      if (index >= 0) updatedDocs[index] = { ...updatedDocs[index], uploaded: true, date: new Date().toISOString(), fileInfo }
      else updatedDocs.push({ name: docName, uploaded: true, date: new Date().toISOString(), fileInfo })
      const updatedData = {
        ...data,
        documents: updatedDocs,
        docsReceived: updatedDocs.filter((doc: any) => doc.uploaded).length,
        docsTotal: Math.max(updatedDocs.length, row.docs_total || 0),
        timeline: [
          { action: `${docName} uploaded by client`, time: new Date().toISOString(), type: 'green' },
          ...(data.timeline || []),
        ],
      }
      const { error: updateError } = await db.from('clients').update({
        data: updatedData,
        docs_total: updatedData.docsTotal,
        docs_received: updatedData.docsReceived,
      }).eq('id', row.id)
      if (updateError) {
        await db.storage.from('ca-documents').remove([path])
        return json({ error: updateError.message }, 500)
      }
      const { data: profile } = await db.from('profiles').select('name,firm_name,upi_id,upi_name,razorpay_route_account_id').eq('id', row.ca_id).maybeSingle()
      return json({ path, fileInfo, documents: updatedDocs, client: portalView({ ...row, data: updatedData, docs_total: updatedData.docsTotal, docs_received: updatedData.docsReceived }, profile || {}) })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('client-portal error', error)
    return json({ error: 'Portal request failed' }, 500)
  }
})
