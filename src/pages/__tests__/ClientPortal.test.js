import { fireEvent, render, screen } from '@testing-library/react';
import ClientPortal from '../ClientPortal';

const client = {
  id: 8,
  portalToken: 'portal-token-for-pramod',
  name: 'Pramod Kumar',
  pan: 'ABCDE1234F',
  type: 'ITR-1',
  plan: 'Starter',
  status: 'waiting_docs',
  feeAmount: 100,
  feePaid: false,
  feePaymentStatus: 'pending',
  docsReceived: 0,
  docsTotal: 2,
  upiId: 'caraj@upi',
  upiName: 'CA Raj',
  documents: [
    { name: 'Form 16', uploaded: false },
    { name: 'PAN card', uploaded: false },
  ],
  timeline: [],
};

describe('ClientPortal client-specific details', () => {
  test('shows live CA fee details, actual filing status, and upload controls per document', () => {
    render(<ClientPortal client={client} isClientView />);

    expect(screen.getByText('Professional fee · CA Raj')).toBeInTheDocument();
    expect(screen.getByText('Waiting for documents')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload Form 16')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload PAN card')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Docs/ }));
    expect(screen.getByText('Uploaded documents')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload Form 16')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload PAN card')).toBeInTheDocument();
  });
});
