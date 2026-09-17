import { useState } from 'react';
import { uploadPortalDocument, reportPortalPayment } from '../lib/supabase';
import './ClientPortal.css';

const getCASettings = () => {
  try { return JSON.parse(localStorage.getItem('ca_settings') || '{}'); }
  catch { return {}; }
};

const makeUpiLink = (upiId, name, amount, desc) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || 'CA')}&am=${amount}&tn=${encodeURIComponent(desc)}&cu=INR`;

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const STATUS_STEPS = [
  { value: 'waiting_docs', label: 'Waiting for documents' },
  { value: 'docs_received', label: 'Documents received' },
  { value: 'computation_done', label: 'Computation complete' },
  { value: 'return_prepared', label: 'Return prepared' },
  { value: 'client_approved', label: 'Awaiting client approval' },
  { value: 'filed', label: 'Return filed' },
  { value: 'ack_received', label: 'Acknowledgment received' },
];
const LEGACY_STATUS = { docs_pending: 'waiting_docs', under_review: 'docs_received' };

export default function ClientPortal({ client, onBack, showToast, isClientView = false, onDocumentUploaded, onReportPayment }) {
  const [tab, setTab] = useState('home');
  const [toast, setToast]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState('');
  const [msg, setMsg] = useState('');
  const [reportingPayment, setReportingPayment] = useState(false);
  const paid = !!client?.feePaid;
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [msgs, setMsgs] = useState([
    { text:"Hi! Please upload your rent receipts when you get a chance — it's the last document we need.", from:'ca' },
    { text:'Sure, will do it by tonight!', from:'client' },
  ]);

  const showPortalToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleFileChange = async (e, targetDocName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showPortalToast('File too large. Max 10MB.'); return; }
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { showPortalToast('Choose a PDF, JPG or PNG file.'); return; }

    const docName = targetDocName || client.documents.find(d => !d.uploaded)?.name || file.name;
    setUploading(true);
    setUploadingDocument(docName);
    showPortalToast('Uploading…');

    let fileUrl = null;
    const result = await uploadPortalDocument(file, client.portalToken, docName);
    if (result.error) {
      // Supabase not configured yet — fall back to local tracking only
      if (result.error !== 'Supabase not configured') {
        showPortalToast(`Upload failed: ${result.error}`);
        setUploading(false);
        setUploadingDocument('');
        e.target.value = '';
        return;
      }
    } else {
      fileUrl = result.path;
    }

    const fileInfo = result.fileInfo || { fileName: file.name, fileType: file.type, fileSize: file.size, fileUrl };
    if (result.client) onDocumentUploaded?.(result.client);
    else if (onDocumentUploaded) onDocumentUploaded(client.id, docName, fileInfo);
    showPortalToast(`✓ ${file.name} uploaded`);
    setUploading(false);
    setUploadingDocument('');
    e.target.value = '';
  };

  const handleReportPayment = async () => {
    setReportingPayment(true);
    const result = await reportPortalPayment(client.portalToken);
    setReportingPayment(false);
    if (result.error) { showPortalToast(`Could not report payment: ${result.error}`); return; }
    onReportPayment?.(result.data.client);
    setShowUpiModal(false);
    showPortalToast('Payment reported. Your CA will confirm it.');
  };


  const sendMsg = () => {
    if (!msg.trim()) return;
    setMsgs(prev=>[...prev,{text:msg,from:'client'}]);
    setMsg('');
  };

  const caSettings = getCASettings();
  const upiId   = client.upiId || caSettings.upiId || '';
  const upiName = client.upiName || caSettings.upiName || 'Your CA';
  const normalizedStatus = LEGACY_STATUS[client.status] || client.status || 'waiting_docs';
  const currentStage = STATUS_STEPS.findIndex(step => step.value === normalizedStatus);
  const statusLabel = STATUS_STEPS[currentStage]?.label || String(normalizedStatus).replace(/_/g, ' ');
  const statusSteps = STATUS_STEPS.map((step, index) => ({
    ...step,
    done: currentStage >= 0 && index < currentStage,
    active: index === currentStage,
  }));
  const uploadControl = (doc) => !doc.uploaded && (
    <label className="portal-doc-upload" title={`Upload ${doc.name}`}>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={uploading}
        aria-label={`Upload ${doc.name}`}
        onChange={e => handleFileChange(e, doc.name)} />
      <span>{uploadingDocument === doc.name ? 'Uploading…' : 'Upload'}</span>
    </label>
  );

  const handlePayFee = () => {
    if (!upiId) { showPortalToast('Payment not set up yet — contact your CA'); return; }
    const desc    = `${client.type} FY 2025-26 Fee`;
    const upiLink = makeUpiLink(upiId, upiName, client.feeAmount, desc);
    if (isMobile()) {
      window.location.href = upiLink;
    }
    // desktop shows QR + copy — handled in JSX below
  };

  const tabs = [
    {id:'home',  icon:'⊞', label:'Home'},
    {id:'docs',  icon:'◫', label:'Docs'},
    {id:'status',icon:'◷', label:'Status'},
    {id:'msg',   icon:'◎', label:'Message'},
  ];

  return (
    <div className="portal-outer">
      <div className="portal-phone">
        <div className="portal-hero">
          <div className="portal-hero-top">
            <div className="portal-logo"><div className="portal-logo-dot">CA</div>CAPortal</div>
            <div className="portal-notif">🔔</div>
          </div>
          <div className="portal-greeting">Good morning</div>
          <div className="portal-name">{client.name}</div>
          <div className="portal-status-card">
            <div className="psc-icon">📄</div>
            <div>
              <div className="psc-label">{client.type || 'ITR'} · FY 2025–26</div>
              <div className="psc-val">{statusLabel}</div>
            </div>
            <div className="psc-pill">Active</div>
          </div>
        </div>

        <div className="portal-body">
          {tab==='home' && <>
            <div style={{marginBottom:14}}>
              <div className="ps-title">Document checklist</div>
              {client.documents.map((doc,i)=>(
                <div className={`checklist-item ${!doc.uploaded?'missing':''}`} key={i}>
                  <div className={`ci-check ${doc.uploaded?'ci-done':'ci-miss'}`}>{doc.uploaded?'✓':''}</div>
                  <div className="ci-name">{doc.name}</div>
                  <span className={`ci-badge ${doc.uploaded?'ci-ok':'ci-no'}`}>{doc.uploaded?'Done':'Needed'}</span>
                  {uploadControl(doc)}
                </div>
              ))}
            </div>

            {/* Fee payment card */}
            {!paid && client.feePaymentStatus !== 'reported' && client.feeAmount > 0 && upiId && (
              <div className="portal-fee-card">
                <div className="pfc-left">
                  <div className="pfc-label">Professional fee · {upiName}</div>
                  <div className="pfc-amount">₹{client.feeAmount.toLocaleString()}</div>
                  <div className="pfc-sub">{client.type} · FY 2025–26</div>
                </div>
                {isMobile()
                  ? <button className="pfc-btn" onClick={handlePayFee}>Pay via UPI →</button>
                  : <button className="pfc-btn" onClick={() => setShowUpiModal(true)}>Pay ₹{client.feeAmount.toLocaleString()} →</button>
                }
              </div>
            )}
            {!paid && client.feePaymentStatus === 'reported' && (
              <div className="portal-fee-card">
                <div className="pfc-left">
                  <div className="pfc-label">Professional fee · {upiName}</div>
                  <div className="pfc-amount">₹{client.feeAmount.toLocaleString()}</div>
                </div>
                <span style={{fontSize:12,color:'var(--amber)',fontWeight:600}}>Payment reported · awaiting CA confirmation</span>
              </div>
            )}
            {paid && (
              <div className="portal-fee-card portal-fee-paid">
                <div className="pfc-left">
                  <div className="pfc-label">Professional fee · {upiName}</div>
                  <div className="pfc-amount">₹{client.feeAmount.toLocaleString()}</div>
                </div>
                <span style={{fontSize:12,color:'var(--green)',fontWeight:600}}>✓ Paid</span>
              </div>
            )}

            {/* UPI modal for desktop */}
            {showUpiModal && (
              <div className="upi-modal-overlay" onClick={() => setShowUpiModal(false)}>
                <div className="upi-modal" onClick={e => e.stopPropagation()}>
                  <div className="upi-modal-title">Pay ₹{client.feeAmount.toLocaleString()} to {upiName}</div>
                  <div className="upi-modal-sub">Scan with GPay, PhonePe, Paytm or any UPI app</div>
                  <img
                    className="upi-qr"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(makeUpiLink(upiId, upiName, client.feeAmount, client.type + ' Fee'))}`}
                    alt="UPI QR Code"
                  />
                  <div className="upi-id-row">
                    <span className="upi-id-label">UPI ID</span>
                    <span className="upi-id-val">{upiId}</span>
                    <button className="upi-copy-btn" onClick={() => {
                      navigator.clipboard?.writeText(upiId);
                      showPortalToast('UPI ID copied');
                    }}>Copy</button>
                  </div>
                  <div className="upi-amount-row">
                    <span className="upi-id-label">Amount</span>
                    <span className="upi-id-val" style={{color:'var(--green)',fontWeight:700}}>₹{client.feeAmount.toLocaleString()}</span>
                  </div>
                  <button className="upi-paid-btn" disabled={reportingPayment} onClick={handleReportPayment}>
                    {reportingPayment ? 'Sending…' : 'I have paid · notify my CA'}
                  </button>
                  <button className="upi-close-btn" onClick={() => setShowUpiModal(false)}>Cancel</button>
                </div>
              </div>
            )}
            {!paid && client.feeAmount > 0 && upiId && client.feePaymentStatus !== 'reported' && (
              <button className="upi-paid-btn" style={{width:'100%', marginTop:8}} disabled={reportingPayment} onClick={handleReportPayment}>
                {reportingPayment ? 'Sending…' : 'I have paid · notify my CA'}
              </button>
            )}
            {!paid && client.feeAmount > 0 && !upiId && (
              <div className="portal-fee-card">
                <div className="pfc-left">
                  <div className="pfc-label">Professional fee · {upiName}</div>
                  <div className="pfc-amount">₹{client.feeAmount.toLocaleString()}</div>
                  <div className="pfc-sub">Contact your CA for payment details.</div>
                </div>
              </div>
            )}

            {toast && <div className="upload-toast">{toast}</div>}
            <div className="ps-title" style={{marginTop:14}}>Upload document</div>
            <label className={`upload-zone ${uploading ? 'upload-zone-busy' : ''}`}>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}}
                disabled={uploading} onChange={e => handleFileChange(e, null)} />
              <div className="uz-icon">{uploading ? '⏳' : '📤'}</div>
              <div className="uz-text">{uploading ? 'Uploading…' : 'Tap to upload'}</div>
              <div className="uz-sub">PDF, JPG or PNG · max 10MB</div>
            </label>
          </>}

          {tab==='status' && <>
            <div className="ps-title" style={{marginBottom:12}}>Filing progress</div>
            {statusSteps.map((step,i)=>(
              <div className="status-step" key={i}>
                <div className="step-indicator">
                  <div className={`step-circle ${step.done?'step-done-c':step.active?'step-active-c':'step-pend-c'}`}>
                    {step.done?'✓':step.active?'…':''}
                  </div>
                  {i<statusSteps.length-1&&<div className="step-connector"/>}
                </div>
                <div style={{paddingBottom:step.active?0:8}}>
                  <div className={`step-label ${!step.done&&!step.active?'step-label-inactive':''}`}>{step.label}</div>
                  <div className="step-time">{step.active ? 'Current step' : step.done ? 'Complete' : 'Pending'}</div>
                </div>
              </div>
            ))}
          </>}

          {tab==='docs' && <>
            <div className="ps-title">Uploaded documents</div>
            <div className="card" style={{padding:'8px 12px',marginBottom:14}}>
              {client.documents.map((doc,i)=>(
                <div className="portal-doc-row" key={i}>
                  <span className="pdr-icon">{doc.uploaded ? '📄' : '!'}</span>
                  <span className="pdr-name">{doc.name}</span>
                  {doc.uploaded ? <span className="pdr-date">{doc.date || 'Uploaded'}</span> : uploadControl(doc)}
                </div>
              ))}
            </div>
            <label className={`upload-zone ${uploading ? 'upload-zone-busy' : ''}`}>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}}
                disabled={uploading} onChange={e => handleFileChange(e, null)} />
              <div className="uz-icon">{uploading ? '⏳' : '📤'}</div>
              <div className="uz-text">{uploading ? 'Uploading…' : 'Upload more documents'}</div>
              <div className="uz-sub">PDF, JPG or PNG</div>
            </label>
          </>}

          {tab==='msg' && <>
            <div className="ps-title">Message your CA</div>
            <div className="msg-list">
              {msgs.map((m,i)=>(
                <div key={i} className={`msg ${m.from==='ca'?'msg-ca':'msg-client'}`}>{m.text}</div>
              ))}
            </div>
            <div className="msg-input-row">
              <input className="input" placeholder="Type a message..." value={msg} onChange={e=>setMsg(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&sendMsg()} />
              <button className="btn btn-primary btn-sm" onClick={sendMsg}>Send</button>
            </div>
          </>}
        </div>

        <div className="portal-bottom-nav">
          {tabs.map(t=>(
            <button key={t.id} className={`bn-item ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              <span className="bn-icon">{t.icon}</span>
              <span className="bn-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:240,paddingTop:8}}>
        {onBack && (
          <button className="btn btn-ghost btn-sm" style={{marginBottom:16,width:'100%',justifyContent:'center'}} onClick={onBack}>
            ← Back to dashboard
          </button>
        )}
        <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>Client view</div>
        <div className="portal-info-box" style={{marginBottom:10}}>
          <div className="pib-title">{client.name}</div>
          {[
            ['PAN', client.pan],
            ['Plan', client.plan],
            ['Filing type', client.type],
            ['Docs uploaded', `${client.docsReceived} / ${client.docsTotal}`],
            ['Fee status', client.feePaid ? `Paid — ₹${client.feeAmount.toLocaleString()}` : client.feePaymentStatus === 'reported' ? `Reported — ₹${client.feeAmount.toLocaleString()}` : `Pending — ₹${client.feeAmount.toLocaleString()}`],
          ].map(([l,v])=>(
            <div className="pib-item" key={l}><span className="pib-label">{l}</span><span className="pib-val">{v}</span></div>
          ))}
        </div>
        <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.7}}>
          This is exactly what {client.name.split(' ')[0]} sees when they open their portal link. All 4 tabs are interactive.
        </div>
      </div>
    </div>
  );
}
