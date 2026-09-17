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

const selectClient = 'id,ca_id,name,phone,type,status,fee_amount,fee_paid,fee_payment_status,docs_total,docs_received,portal_token,data'

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
      const { data: profile } = await db.from('profiles').select('name,firm_name,upi_id,upi_name').eq('id', row.ca_id).maybeSingle()
      return json({ client: portalView(row, profile || {}) })
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
      const { data: profile } = await db.from('profiles').select('name,firm_name,upi_id,upi_name').eq('id', row.ca_id).maybeSingle()
      return json({ path, fileInfo, documents: updatedDocs, client: portalView({ ...row, data: updatedData, docs_total: updatedData.docsTotal, docs_received: updatedData.docsReceived }, profile || {}) })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('client-portal error', error)
    return json({ error: 'Portal request failed' }, 500)
  }
})
