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

function toE164(value: string) {
  let digits = value.replace(/[^\d+]/g, '')
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`
  if (!digits.startsWith('+')) {
    if (digits.length === 12 && digits.startsWith('91')) digits = `+${digits}`
    else {
    digits = digits.startsWith('0') ? digits.slice(1) : digits
    digits = `+91${digits}`
    }
  }
  const normalized = `+${digits.slice(1).replace(/\D/g, '')}`
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const authHeader = req.headers.get('Authorization') ?? ''
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) return json({ error: 'Sign in is required' }, 401)

  const sid = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM') ?? ''
  const contentSid = Deno.env.get('TWILIO_WHATSAPP_CONTENT_SID') ?? ''
  if (!sid || !authToken || !from || !contentSid) {
    return json({ error: 'Twilio is not configured', code: 'twilio_not_configured' }, 503)
  }
  if (!/^AC[a-f\d]{32}$/i.test(sid) || !/^whatsapp:\+\d{8,15}$/.test(from) || !/^HX[a-f\d]{32}$/i.test(contentSid)) {
    return json({ error: 'Twilio sender configuration is invalid', code: 'twilio_invalid_config' }, 503)
  }

  try {
    const body = await req.json()
    const clientId = Number(body?.clientId)
    const requestedDoc = typeof body?.docName === 'string' ? body.docName.trim() : ''
    if (!Number.isSafeInteger(clientId) || clientId <= 0 || requestedDoc.length > 160) {
      return json({ error: 'A valid client and document are required' }, 400)
    }

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: { persistSession: false },
    })
    const { data: row, error: clientError } = await admin.from('clients')
      .select('id,ca_id,name,phone,portal_token,data')
      .eq('id', clientId).eq('ca_id', user.id).maybeSingle()
    if (clientError) return json({ error: 'Could not load client' }, 500)
    if (!row) return json({ error: 'Client not found' }, 404)

    const clientData = row.data || {}
    if (clientData.whatsappOptIn !== true) {
      return json({ error: 'Client WhatsApp consent is required', code: 'whatsapp_opt_in_required' }, 403)
    }
    const phone = toE164(String(row.phone || ''))
    if (!phone) return json({ error: 'Client needs a valid mobile number including country code' }, 400)

    const docs = Array.isArray(clientData.documents) ? clientData.documents : []
    const missing = docs.filter((doc: any) => !doc?.uploaded && typeof doc?.name === 'string')
    let requested = missing
    if (requestedDoc) {
      const match = docs.find((doc: any) => doc?.name === requestedDoc)
      if (!match) return json({ error: 'Requested document is not on this client checklist' }, 400)
      if (match.uploaded) return json({ error: 'That document has already been received' }, 409)
      requested = [match]
    }
    if (!requested.length) return json({ error: 'There are no missing documents to remind this client about' }, 409)

    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('name,firm_name').eq('id', row.ca_id).maybeSingle()
    if (profileError) return json({ error: 'Could not load CA profile' }, 500)

    const missingNames = requested.map((doc: any) => doc.name).join(', ').slice(0, 500)
    const portalUrl = `https://www.caportal.co/?portal=${encodeURIComponent(row.portal_token)}`
    const variables = {
      '1': String(row.name || 'there').slice(0, 100),
      '2': String(profile?.name || profile?.firm_name || 'your CA').slice(0, 100),
      '3': missingNames,
      '4': portalUrl,
    }
    const form = new URLSearchParams({
      From: from,
      To: `whatsapp:${phone}`,
      ContentSid: contentSid,
      ContentVariables: JSON.stringify(variables),
    })
    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    })
    if (!twilioResponse.ok) {
      // Do not return Twilio's response body: it can contain account and recipient details.
      return json({ error: 'Twilio could not accept this reminder', code: 'twilio_send_failed' }, 502)
    }
    const result = await twilioResponse.json()
    return json({ sent: true, messageSid: result.sid, status: result.status })
  } catch {
    return json({ error: 'Unable to send reminder right now' }, 500)
  }
})
