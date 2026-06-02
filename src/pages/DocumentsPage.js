import { useState } from 'react';

export default function DocumentsPage({ clients, onSelectClient }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const allDocs = clients.flatMap(c =>
    c.documents.map(d => ({ ...d, clientId: c.id, clientName: c.name, pan: c.pan }))
  );

  const shown = allDocs.filter(d => {
    const matchFilter = filter === 'all' || (filter === 'uploaded' ? d.uploaded : !d.uploaded);
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalUploaded = allDocs.filter(d => d.uploaded).length;
  const totalMissing  = allDocs.filter(d => !d.uploaded).length;

  return (
    <div className="page">
      <div className="page-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="page-title">Documents</span>
          <span className="page-breadcrumb">/ all clients</span>
        </div>
        <div className="page-actions">
          <input className="input" placeholder="Search docs or client..." style={{ width: 220 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {[
          { label: 'Total documents', val: allDocs.length, sub: 'across all clients', color: 'var(--text)' },
          { label: 'Uploaded',        val: totalUploaded, sub: `${Math.round(totalUploaded / allDocs.length * 100)}% complete`, color: 'var(--green)' },
          { label: 'Missing',         val: totalMissing,  sub: 'awaiting upload', color: 'var(--amber)' },
        ].map(m => (
          <div key={m.label} style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: m.color, lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {[['all','All'],['uploaded','Uploaded'],['missing','Missing']].map(([v, l]) => (
            <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(v)}>{l}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>
            {shown.length} documents
          </span>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 14px' }}>
            {['Document', 'Client', 'Uploaded', 'Status'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 6px' }}>{h}</div>
            ))}
          </div>
          {shown.map((doc, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr', padding: '0 14px', borderBottom: i < shown.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s' }}
              onClick={() => onSelectClient({ id: doc.clientId })}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ padding: '10px 6px' }}>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>{doc.name}</div>
              </div>
              <div style={{ padding: '10px 6px' }}>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{doc.clientName}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{doc.pan}</div>
              </div>
              <div style={{ padding: '10px 6px', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
                {doc.uploaded ? doc.date : '—'}
              </div>
              <div style={{ padding: '10px 6px' }}>
                <span className={`pill ${doc.uploaded ? 'pill-green' : 'pill-amber'}`}>
                  {doc.uploaded ? 'Done' : 'Needed'}
                </span>
              </div>
            </div>
          ))}
          {shown.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
              No documents found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
