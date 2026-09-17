import { fireEvent, render, screen } from '@testing-library/react';
import ClientDetail from '../ClientDetail';

const client = {
  id: 8,
  portalToken: 'portal-token-for-pramod',
  name: 'Pramod Kumar',
  pan: 'ABCDE1234F',
  phone: '+91 98765 43210',
  email: 'pramod@example.com',
  type: 'ITR-1',
  plan: 'Starter',
  status: 'waiting_docs',
  feeAmount: 100,
  feePaid: false,
  feePaymentStatus: 'pending',
  docsReceived: 0,
  docsTotal: 1,
  documents: [{ name: 'Form 16', uploaded: false, date: null }],
  timeline: [],
  acknowledgments: [],
};

describe('ClientDetail WhatsApp actions', () => {
  let originalOpen;
  const showToast = jest.fn();

  beforeEach(() => {
    originalOpen = window.open;
    window.open = jest.fn(() => ({ opener: window }));
    showToast.mockClear();
  });

  afterEach(() => { window.open = originalOpen; });

  test('Send WhatsApp opens a prefilled reminder with the secure client link', () => {
    render(<ClientDetail client={client} user={{ name: 'Raj' }} showToast={showToast} />);

    fireEvent.click(screen.getByRole('button', { name: /Send WhatsApp/ }));

    expect(window.open).toHaveBeenCalledTimes(1);
    const [url] = window.open.mock.calls[0];
    expect(url).toContain('wa.me/919876543210');
    expect(decodeURIComponent(url)).toContain('portal-token-for-pramod');
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('press Send in WhatsApp'));
  });

  test('a document reminder names the missing document in its WhatsApp draft', () => {
    render(<ClientDetail client={client} user={{ name: 'Raj' }} showToast={showToast} />);

    fireEvent.click(screen.getByRole('button', { name: 'Send reminder' }));

    const [url] = window.open.mock.calls[0];
    expect(decodeURIComponent(url)).toContain('Form 16');
  });
});
