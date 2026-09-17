import { clientFromRow, clientToRow } from '../supabase';

describe('Supabase client row mapping', () => {
  const client = {
    id: 123,
    portalToken: 'a'.repeat(48),
    name: 'Priya Sharma',
    pan: 'ABCPS1234D',
    phone: '+91 98765 43210',
    email: 'priya@example.com',
    type: 'ITR-1',
    plan: 'Pro',
    status: 'docs_received',
    feeAmount: 3500,
    feePaid: false,
    feePaymentStatus: 'reported',
    whatsappOptIn: true,
    docsReceived: 1,
    docsTotal: 2,
    documents: [{ name: 'Form 16', uploaded: true, date: 'Today' }, { name: 'PAN', uploaded: false, date: null }],
    timeline: [{ action: 'Client added', time: 'Today', type: 'gray' }],
    acknowledgments: [{ id: 1, type: 'itr', refNo: 'ACK-1' }],
  };

  test('writes ownership and full client payload while mirroring query fields', () => {
    const row = clientToRow(client, 'ca-user-id');
    expect(row).toMatchObject({
      ca_id: 'ca-user-id', portal_token: client.portalToken, fee_amount: 3500,
      fee_paid: false, fee_payment_status: 'reported', docs_received: 1, docs_total: 2,
    });
    expect(row.data).toMatchObject({ documents: client.documents, timeline: client.timeline, acknowledgments: client.acknowledgments, whatsappOptIn: true });
  });

  test('restores nested client data and uses database-owned identifiers/status', () => {
    const restored = clientFromRow({
      id: 77, portal_token: client.portalToken, name: client.name, pan: client.pan,
      status: 'filed', fee_amount: 3500, fee_paid: false, fee_payment_status: 'reported',
      docs_received: 1, docs_total: 2, data: client,
    });
    expect(restored.id).toBe(77);
    expect(restored.status).toBe('filed');
    expect(restored.feePaymentStatus).toBe('reported');
    expect(restored.documents).toEqual(client.documents);
    expect(restored.acknowledgments).toEqual(client.acknowledgments);
    expect(restored.whatsappOptIn).toBe(true);
  });
});
