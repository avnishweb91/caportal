import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientFormModal from '../ClientFormModal';
import { WORK_TYPE_IDS, WORK_TYPES, DOCS_BY_TYPE } from '../../lib/workTypeTemplates';

const onSave  = jest.fn();
const onClose = jest.fn();

beforeEach(() => { onSave.mockClear(); onClose.mockClear(); });

const renderModal = (client = null) =>
  render(<ClientFormModal client={client} onSave={onSave} onClose={onClose} />);

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('ClientFormModal — rendering', () => {
  test('shows "Add new client" title when no client prop', () => {
    renderModal();
    expect(screen.getByText('Add new client')).toBeInTheDocument();
  });
  test('shows "Edit client" title when client prop provided', () => {
    renderModal({ name: 'Test', pan: 'ABCDE1234F', phone: '9999999999', email: 't@t.com', type: 'ITR-1', plan: 'Starter', feeAmount: 1000, documents: [] });
    expect(screen.getByText('Edit client')).toBeInTheDocument();
  });
  test('all 8 filing types appear in the dropdown', () => {
    renderModal();
    const select = screen.getByDisplayValue('ITR-1 (Sahaj)');
    const options = within(select).queryAllByRole('option');
    const optionValues = options.map(o => o.value);
    WORK_TYPE_IDS.forEach(id => expect(optionValues).toContain(id));
  });
  test('doc preview shows on add mode', () => {
    renderModal();
    expect(screen.getByText(/Auto-loaded checklist/i)).toBeInTheDocument();
  });
  test('doc preview hidden in edit mode', () => {
    renderModal({ name: 'A', pan: 'ABCDE1234F', phone: '9', email: 'a@a.com', type: 'ITR-1', plan: 'Starter', feeAmount: 500, documents: [] });
    expect(screen.queryByText(/Auto-loaded checklist/i)).not.toBeInTheDocument();
  });
});

// ── Filing type → doc preview ─────────────────────────────────────────────────

describe('ClientFormModal — filing type changes', () => {
  test('default type is ITR-1 with correct doc count', () => {
    renderModal();
    const expected = DOCS_BY_TYPE['ITR-1'].length;
    expect(screen.getByText(new RegExp(`${expected} documents`, 'i'))).toBeInTheDocument();
  });
  test('switching to ITR-2 updates doc preview', () => {
    renderModal();
    fireEvent.change(screen.getByDisplayValue('ITR-1 (Sahaj)'), { target: { value: 'ITR-2' } });
    const expected = DOCS_BY_TYPE['ITR-2'].length;
    expect(screen.getByText(new RegExp(`${expected} documents`, 'i'))).toBeInTheDocument();
  });
  test('switching to Company ITR shows 9 docs', () => {
    renderModal();
    fireEvent.change(screen.getByDisplayValue('ITR-1 (Sahaj)'), { target: { value: 'Company ITR' } });
    expect(screen.getByText(/9 documents/i)).toBeInTheDocument();
  });
  test('description hint updates when type changes', () => {
    renderModal();
    const itr2Desc = WORK_TYPES.find(t => t.id === 'ITR-2').description;
    fireEvent.change(screen.getByDisplayValue('ITR-1 (Sahaj)'), { target: { value: 'ITR-2' } });
    expect(screen.getByText(new RegExp(itr2Desc.slice(0, 30), 'i'))).toBeInTheDocument();
  });
});

// ── Validation ────────────────────────────────────────────────────────────────

describe('ClientFormModal — validation', () => {
  test('all 5 required fields show errors when form is empty', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /Add client/i }));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('PAN is required')).toBeInTheDocument();
    expect(screen.getByText('Phone is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText(/valid fee/i)).toBeInTheDocument();
  });
  test('invalid PAN format shows error', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('ABCDE1234F'), { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByRole('button', { name: /Add client/i }));
    expect(screen.getByText(/Invalid PAN format/i)).toBeInTheDocument();
  });
  test('valid PAN passes format check (ABCDE1234F)', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('ABCDE1234F'), { target: { value: 'ABCDE1234F' } });
    fireEvent.change(screen.getByPlaceholderText('Priya Sharma'), { target: { value: 'Test User' } });
    fireEvent.click(screen.getByRole('button', { name: /Add client/i }));
    expect(screen.queryByText(/Invalid PAN format/i)).not.toBeInTheDocument();
  });
  test('negative fee amount rejected', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('3500'), { target: { value: '-100' } });
    fireEvent.click(screen.getByRole('button', { name: /Add client/i }));
    expect(screen.getByText(/valid fee/i)).toBeInTheDocument();
  });
  test('zero fee amount rejected', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('3500'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: /Add client/i }));
    expect(screen.getByText(/valid fee/i)).toBeInTheDocument();
  });
});

// ── Submission ────────────────────────────────────────────────────────────────

describe('ClientFormModal — submission', () => {
  const fillValidForm = (type = 'ITR-4') => {
    fireEvent.change(screen.getByPlaceholderText('Priya Sharma'), { target: { value: 'Test Client' } });
    fireEvent.change(screen.getByPlaceholderText('ABCDE1234F'),   { target: { value: 'ABCDE1234F' } });
    fireEvent.change(screen.getByPlaceholderText('+91 98765 43210'), { target: { value: '+91 9999999999' } });
    fireEvent.change(screen.getByPlaceholderText('client@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('3500'),           { target: { value: '2500' } });
    const select = screen.getByDisplayValue('ITR-1 (Sahaj)');
    fireEvent.change(select, { target: { value: type } });
  };

  test('valid submit calls onSave with PAN uppercased', () => {
    renderModal();
    fireEvent.change(screen.getByPlaceholderText('ABCDE1234F'), { target: { value: 'abcde1234f' } });
    fireEvent.change(screen.getByPlaceholderText('Priya Sharma'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('+91 98765 43210'), { target: { value: '9999999999' } });
    fireEvent.change(screen.getByPlaceholderText('client@example.com'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('3500'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /Add client/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ pan: 'ABCDE1234F' }));
  });
  test('documents loaded from selected template', () => {
    renderModal();
    fillValidForm('ITR-2');
    fireEvent.click(screen.getByRole('button', { name: /Add client/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      documents: DOCS_BY_TYPE['ITR-2'].map(name => ({ name, uploaded: false, date: null })),
    }));
  });
  test('docsTotal matches document count', () => {
    renderModal();
    fillValidForm('Company ITR');
    fireEvent.click(screen.getByRole('button', { name: /Add client/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      docsTotal: DOCS_BY_TYPE['Company ITR'].length,
    }));
  });
  test('cancel button calls onClose', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
