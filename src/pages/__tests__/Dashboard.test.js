import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';

const mockClients = [
  { id: 1, name: 'Priya Sharma',   pan: 'ABCPS1234D', phone: '111', email: 'a@a.com', type: 'ITR-1', plan: 'Pro',     status: 'return_prepared', docsReceived: 4, docsTotal: 5, feeAmount: 3500, feePaid: false, documents: [], timeline: [] },
  { id: 2, name: 'Vikram Textiles', pan: 'AABFV5678K', phone: '222', email: 'b@b.com', type: 'GST + ITR', plan: 'Starter', status: 'waiting_docs',   docsReceived: 3, docsTotal: 5, feeAmount: 8000, feePaid: false, documents: [], timeline: [] },
  { id: 3, name: 'Anand Mehta',    pan: 'AAGPM9012F', phone: '333', email: 'c@c.com', type: 'ITR-1', plan: 'Starter', status: 'ack_received',   docsReceived: 4, docsTotal: 4, feeAmount: 2500, feePaid: true,  documents: [], timeline: [] },
];

const defaultProps = {
  clients: mockClients,
  onSelectClient: jest.fn(),
  onAddClient: jest.fn(),
  showToast: jest.fn(),
  billing: { isTrialing: false, isExpired: false, daysLeft: 20 },
  onUpgrade: jest.fn(),
};

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Dashboard — rendering', () => {
  test('shows all clients by default', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Vikram Textiles')).toBeInTheDocument();
    expect(screen.getByText('Anand Mehta')).toBeInTheDocument();
  });
  test('shows client count', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText(/3 shown/i)).toBeInTheDocument();
  });
  test('shows filed metric (filed + ack_received)', () => {
    render(<Dashboard {...defaultProps} />);
    // Anand has ack_received → "ITR filed" metric shows 1
    const metricTiles = document.querySelectorAll('.metric-val');
    const filedTile = Array.from(metricTiles).find(el => el.textContent === '1');
    expect(filedTile).toBeTruthy();
  });
  test('shows empty state when no clients', () => {
    render(<Dashboard {...defaultProps} clients={[]} />);
    // Empty state has a specific CTA button
    expect(screen.getByRole('button', { name: /Add your first client →/i })).toBeInTheDocument();
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

describe('Dashboard — search', () => {
  test('filters by client name', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Search clients/i), { target: { value: 'priya' } });
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.queryByText('Vikram Textiles')).not.toBeInTheDocument();
  });
  test('filters by PAN', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Search clients/i), { target: { value: 'AAGPM' } });
    expect(screen.getByText('Anand Mehta')).toBeInTheDocument();
    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
  });
  test('shows empty search result message', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Search clients/i), { target: { value: 'zzznomatch' } });
    expect(screen.getByText(/No clients match/i)).toBeInTheDocument();
  });
  test('search is case-insensitive', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Search clients/i), { target: { value: 'PRIYA' } });
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
  });
});

// ── Status filter ─────────────────────────────────────────────────────────────

describe('Dashboard — status filter', () => {
  test('filter by waiting_docs shows only matching clients', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
    // Click the filter-item button specifically (not the status pill)
    fireEvent.click(screen.getByRole('button', { name: /^Waiting docs$/ }));
    expect(screen.getByText('Vikram Textiles')).toBeInTheDocument();
    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
  });
  test('filter by ack_received shows completed clients', () => {
    render(<Dashboard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Ack received$/ }));
    expect(screen.getByText('Anand Mehta')).toBeInTheDocument();
    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
  });
});
