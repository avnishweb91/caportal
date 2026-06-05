import { useState } from 'react';
import { WORK_TYPES } from '../lib/workTypeTemplates';
import './TemplatesPage.css';

const COLOR_CLS = {
  blue:   'tmpl-blue',
  purple: 'tmpl-purple',
  amber:  'tmpl-amber',
  green:  'tmpl-green',
  red:    'tmpl-red',
};

export default function TemplatesPage() {
  const [active, setActive] = useState(null);

  const selected = active ? WORK_TYPES.find(t => t.id === active) : null;

  return (
    <div className="page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="page-title">Work Type Templates</span>
          <span className="page-breadcrumb">/ {WORK_TYPES.length} filing types · auto-populate checklists</span>
        </div>
      </div>

      <div className="tmpl-info-bar">
        These checklists auto-load when you add a new client. Select the filing type in the
        <strong> Add client</strong> form and the correct documents are pre-filled.
      </div>

      <div className="tmpl-body">
        <div className="tmpl-grid">
          {WORK_TYPES.map(t => (
            <button
              key={t.id}
              className={`tmpl-card ${COLOR_CLS[t.color] || ''} ${active === t.id ? 'tmpl-card-active' : ''}`}
              onClick={() => setActive(active === t.id ? null : t.id)}
            >
              <div className="tmpl-card-top">
                <div className="tmpl-card-name">{t.label}</div>
                <div className="tmpl-card-count">{t.documents.length} docs</div>
              </div>
              <div className="tmpl-card-desc">{t.description}</div>
              <div className="tmpl-card-docs">
                {t.documents.slice(0, 3).map(d => (
                  <div key={d} className="tmpl-card-doc">◻ {d}</div>
                ))}
                {t.documents.length > 3 && (
                  <div className="tmpl-card-more">+{t.documents.length - 3} more</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="tmpl-detail">
            <div className={`tmpl-detail-header ${COLOR_CLS[selected.color] || ''}`}>
              <div className="tmpl-detail-name">{selected.label}</div>
              <div className="tmpl-detail-desc">{selected.description}</div>
            </div>
            <div className="tmpl-detail-section-label">Document checklist</div>
            <ol className="tmpl-detail-list">
              {selected.documents.map(d => (
                <li key={d} className="tmpl-detail-item">{d}</li>
              ))}
            </ol>
            <div className="tmpl-detail-note">
              This checklist is pre-loaded when you create a new client with filing type
              <strong> {selected.label}</strong>. Documents can be added or removed per client afterward.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
