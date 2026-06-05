import { render, screen, fireEvent } from '@testing-library/react';
import AcknowledgmentPage from '../AcknowledgmentPage';

const clientsWithAcks = [
  {
    id: 1, name: 'Priya Sharma', pan: 'ABCPS1234D',
    acknowledgments: [
      { id: 101, type: 'itr',  refNo: '327010170920256', period: 'AY 2025-26', filedDate: '2025-07-28', notes: 'e-verified' },
    ],
    timeline: [],
  },
  {
    id: 2, name: 'Vikram Textiles', pan: 'AABFV5678K',
    acknowledgments: [
      { id: 102, type: 'gst',  refNo: 'AA2706261234560', period: 'GSTR-3B May 2026', filedDate: '2026-06-20', notes: '' },
      { id: 103, type: 'tds',  refNo: 'TDS00012345',     period: 'Q1 FY 2025-26',    filedDate: '2025-07-31', notes: '' },
    ],
    timeline: [],
  },
  {
    id: 3, name: 'Anand Mehta', pan: 'AAGPM9012F',
    acknowledgments: [],
    timeline: [],
  },
];

const defaultProps = {
  clients: clientsWithAcks,
  onUpdateClient: jest.fn(),
  showToast: jest.fn(),
  onSelectClient: jest.fn(),
};

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('AcknowledgmentPage — rendering', () => {
  test('shows all 3 ack records by default', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    expect(screen.getByText('3 records')).toBeInTheDocument();
  });
  test('shows client names for each ack', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getAllByText('Vikram Textiles')).toHaveLength(2);
  });
  test('shows ref numbers', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    expect(screen.getByText('327010170920256')).toBeInTheDocument();
  });
  test('shows empty state when no clients have acks', () => {
    const noAckClients = clientsWithAcks.map(c => ({ ...c, acknowledgments: [] }));
    render(<AcknowledgmentPage {...defaultProps} clients={noAckClients} />);
    expect(screen.getByText(/No acknowledgments yet/i)).toBeInTheDocument();
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

describe('AcknowledgmentPage — search', () => {
  test('search by client name', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: 'Priya' } });
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.queryByText('Vikram Textiles')).not.toBeInTheDocument();
    expect(screen.getByText('1 record')).toBeInTheDocument();
  });
  test('search by PAN', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: 'AABFV' } });
    expect(screen.getAllByText('Vikram Textiles')).toHaveLength(2);
    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
  });
  test('search by ref number', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: '327010170920256' } });
    expect(screen.getByText('1 record')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
  });
  test('no results shows message', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: 'zzznomatch' } });
    expect(screen.getByText(/No records match/i)).toBeInTheDocument();
  });
});

// ── Type filter ───────────────────────────────────────────────────────────────

describe('AcknowledgmentPage — type filter', () => {
  test('ITR filter shows only ITR records', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^ITR$/ }));
    expect(screen.getByText('1 record')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.queryByText('Vikram Textiles')).not.toBeInTheDocument();
  });
  test('GST filter shows only GST records', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^GST$/ }));
    expect(screen.getByText('1 record')).toBeInTheDocument();
    expect(screen.getByText('Vikram Textiles')).toBeInTheDocument();
  });
  test('All filter restores full list', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /^ITR$/ }));
    fireEvent.click(screen.getByRole('button', { name: /^All$/ }));
    expect(screen.getByText('3 records')).toBeInTheDocument();
  });
});

// ── Add form ──────────────────────────────────────────────────────────────────

describe('AcknowledgmentPage — add form', () => {
  test('+ Add button toggles the form', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    expect(screen.queryByPlaceholderText(/327010/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /\+ Add/i }));
    expect(screen.getByPlaceholderText(/327010|ARN/i)).toBeInTheDocument();
  });
  test('saving without client shows toast error', () => {
    render(<AcknowledgmentPage {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ Add/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));
    expect(defaultProps.showToast).toHaveBeenCalledWith(
      expect.stringMatching(/client/i), 'error'
    );
  });
});
