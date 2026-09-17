import { buildClientReminderMessage, getWhatsAppUrl, normalizeWhatsAppNumber } from '../utils';

describe('WhatsApp reminder links', () => {
  test('normalizes Indian mobile numbers to WhatsApp international format', () => {
    expect(normalizeWhatsAppNumber('+91 98765 43210')).toBe('919876543210');
    expect(normalizeWhatsAppNumber('09876543210')).toBe('919876543210');
    expect(normalizeWhatsAppNumber('9876543210')).toBe('919876543210');
    expect(normalizeWhatsAppNumber('+1 415 555 0100')).toBe('14155550100');
  });

  test('rejects phone numbers that cannot be safely addressed', () => {
    expect(normalizeWhatsAppNumber('')).toBeNull();
    expect(normalizeWhatsAppNumber('1234')).toBeNull();
  });

  test('builds an encoded WhatsApp URL with the message and portal link', () => {
    const client = {
      name: 'Pramod Kumar',
      phone: '9876543210',
      portalToken: 'a1b2c3',
      documents: [{ name: 'Form 16', uploaded: false }, { name: 'PAN card', uploaded: true }],
    };
    const message = buildClientReminderMessage(client, { caName: 'Raj' });
    const url = getWhatsAppUrl(client.phone, message);

    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(decodeURIComponent(url)).toContain('Hello Pramod, this is CA Raj.');
    expect(decodeURIComponent(url)).toContain('Form 16');
    expect(decodeURIComponent(url)).toContain('portal=a1b2c3');
  });
});
