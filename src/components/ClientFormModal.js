import { useState } from 'react';
import { docsByType } from '../data/mockData';
import './ClientFormModal.css';

const filingTypes = ['Individual ITR', 'GST Only', 'GST + ITR', 'Company ITR', 'Partnership'];
const plans = ['Starter', 'Pro', 'Firm'];

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export default function ClientFormModal({ client, onSave, onClose }) {
  const isEdit = !!client;
  const [form, setForm] = useState({
    name:      client?.name      || '',
    pan:       client?.pan       || '',
    phone:     client?.phone     || '',
    email:     client?.email     || '',
    type:      client?.type      || 'Individual ITR',
    plan:      client?.plan      || 'Starter',
    feeAmount: client?.feeAmount || '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = 'Name is required';
    if (!form.pan.trim())   e.pan  = 'PAN is required';
    else if (!PAN_RE.test(form.pan.toUpperCase())) e.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.feeAmount || isNaN(Number(form.feeAmount)) || Number(form.feeAmount) <= 0)
      e.feeAmount = 'Enter a valid fee amount';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const docNames = docsByType[form.type] || docsByType['Individual ITR'];
    const documents = isEdit
      ? client.documents  // keep existing docs on edit
      : docNames.map(name => ({ name, uploaded: false, date: null }));

    onSave({
      name:       form.name.trim(),
      pan:        form.pan.toUpperCase().trim(),
      phone:      form.phone.trim(),
      email:      form.email.trim().toLowerCase(),
      type:       form.type,
      plan:       form.plan,
      feeAmount:  Number(form.feeAmount),
      documents,
      docsTotal:  documents.length,
      ...(isEdit ? {} : { docsReceived: 0 }),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit client' : 'Add new client'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full name *</label>
              <input className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Priya Sharma"
                value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">PAN *</label>
              <input className={`input ${errors.pan ? 'input-error' : ''}`}
                placeholder="ABCDE1234F"
                value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())}
                maxLength={10} style={{ fontFamily: 'var(--mono)', letterSpacing: '0.05em' }} />
              {errors.pan ? <span className="form-error">{errors.pan}</span> : <span className="form-hint">10-character PAN card number</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className={`input ${errors.phone ? 'input-error' : ''}`}
                placeholder="+91 98765 43210" type="tel"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="client@example.com" type="email"
                value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Filing type *</label>
              <select className="select input" value={form.type} onChange={e => set('type', e.target.value)}>
                {filingTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {!isEdit && (
                <span className="form-hint">
                  Sets default document checklist ({(docsByType[form.type] || []).length} docs)
                </span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Plan *</label>
              <select className="select input" value={form.plan} onChange={e => set('plan', e.target.value)}>
                {plans.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fee amount (₹) *</label>
            <input className={`input ${errors.feeAmount ? 'input-error' : ''}`}
              placeholder="3500" type="number" min="0"
              value={form.feeAmount} onChange={e => set('feeAmount', e.target.value)}
              style={{ fontFamily: 'var(--mono)' }} />
            {errors.feeAmount && <span className="form-error">{errors.feeAmount}</span>}
          </div>

          {!isEdit && form.type && (
            <div className="docs-preview">
              <div className="docs-preview-label">Document checklist ({(docsByType[form.type] || []).length} items)</div>
              <div className="docs-preview-list">
                {(docsByType[form.type] || []).map(d => (
                  <span key={d} className="docs-preview-item">◻ {d}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Add client'}
          </button>
        </div>
      </div>
    </div>
  );
}
