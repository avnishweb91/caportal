import { useState } from 'react';
import './ClientPortal.css';

const getCASettings = () => {
  try { return JSON.parse(localStorage.getItem('ca_settings') || '{}'); }
  catch { return {}; }
};

const makeUpiLink = (upiId, name, amount, desc) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || 'CA')}&am=${amount}&tn=${encodeURIComponent(desc)}&cu=INR`;

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const steps = [
  { label:'Portal link sent',       time:'May 27', done:true,  active:false },
  { label:'Documents received',     time:'Jun 1',  done:true,  active:false },
  { label:'CA review in progress',  time:'Jun 2',  done:false, active:true  },
  { label:'Draft return shared',    time:'Pending',done:false, active:false },
  { label:'ITR filed',              time:'Pending',done:false, active:false },
];

export default function ClientPortal({ client, onBack, showToast, isClientView = false, onDocumentUploaded }) {
  const [tab, setTab] = useState('home');
  const [toast, setToast] = useState(null);
  const [msg, setMsg] = useState('');
  const [paid, setPaid] = useState(client?.feePaid || false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [msgs, setMsgs] = useState([
    { text:"Hi! Please upload your rent receipts when you get a chance — it's the last document we need.", from:'ca' },
    { text:'Sure, will do it by tonight!', from:'client' },
  ]);

  const showPortalToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleFileChange = (e, targetDocName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showPortalToast('File too large. Max 10MB.'); return; }
    const docName = targetDocName || client.documents.find(d => !d.uploaded)?.name || file.name;
    const fileInfo = { fileName: file.name, fileType: file.type, fileSize: file.size };
    if (onDocumentUploaded) {
      onDocumentUploaded(client.id, docName, fileInfo);
    }
    showPortalToast(`✓ ${file.name} uploaded as "${docName}"`);
    e.target.value = '';
  };


  const sendMsg = () => {
    if (!msg.trim()) return;
    setMsgs(prev=>[...prev,{text:msg,from:'client'}]);
    setMsg('');
  };

  const caSettings = getCASettings();
  const upiId   = caSettings.upiId   || '';
  const upiName = caSettings.upiName || 'Your CA';

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
              <div className="psc-label">ITR 2025–26</div>
              <div className="psc-val">CA is reviewing your documents</div>
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
                </div>
              ))}
            </div>

            {/* Fee payment card */}
            {!paid && client.feeAmount > 0 && upiId && (
              <div className="portal-fee-card">
                <div className="pfc-left">
                  <div className="pfc-label">Professional fee</div>
                  <div className="pfc-amount">₹{client.feeAmount.toLocaleString()}</div>
                  <div className="pfc-sub">{client.type} · FY 2025–26</div>
                </div>
                {isMobile()
                  ? <button className="pfc-btn" onClick={handlePayFee}>Pay via UPI →</button>
                  : <button className="pfc-btn" onClick={() => setShowUpiModal(true)}>Pay ₹{client.feeAmount.toLocaleString()} →</button>
                }
              </div>
            )}
            {paid && (
              <div className="portal-fee-card portal-fee-paid">
                <div className="pfc-left">
                  <div className="pfc-label">Professional fee</div>
                  <div className="pfc-amount">₹{client.feeAmount.toLocaleString()}</div>
                </div>
                <span style={{fontSize:12,color:'var(--green)',fontWeight:600}}>✓ Paid</span>
              </div>
            )}

            {/* UPI modal for desktop */}
            {showUpiModal && (
              <div className="upi-modal-overlay" onClick={() => setShowUpiModal(false)}>
                <div className="upi-modal" onClick={e => e.stopPropagation()}>
                  <div className="upi-modal-title">Pay ₹{client.feeAmount.toLocaleString()}</div>
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
                  <button className="upi-paid-btn" onClick={() => { setPaid(true); setShowUpiModal(false); showPortalToast('Thank you! Your CA will confirm the payment.'); }}>
                    I have paid ✓
                  </button>
                  <button className="upi-close-btn" onClick={() => setShowUpiModal(false)}>Cancel</button>
                </div>
              </div>
            )}

            {toast && <div className="upload-toast">{toast}</div>}
            <div className="ps-title" style={{marginTop:14}}>Upload document</div>
            <label className="upload-zone">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}}
                onChange={e => handleFileChange(e, null)} />
              <div className="uz-icon">📤</div>
              <div className="uz-text">Tap to upload</div>
              <div className="uz-sub">PDF, JPG or PNG · max 10MB</div>
            </label>
          </>}

          {tab==='status' && <>
            <div className="ps-title" style={{marginBottom:12}}>Filing progress</div>
            {steps.map((step,i)=>(
              <div className="status-step" key={i}>
                <div className="step-indicator">
                  <div className={`step-circle ${step.done?'step-done-c':step.active?'step-active-c':'step-pend-c'}`}>
                    {step.done?'✓':step.active?'…':''}
                  </div>
                  {i<steps.length-1&&<div className="step-connector"/>}
                </div>
                <div style={{paddingBottom:step.active?0:8}}>
                  <div className={`step-label ${!step.done&&!step.active?'step-label-inactive':''}`}>{step.label}</div>
                  <div className="step-time">{step.time}</div>
                </div>
              </div>
            ))}
          </>}

          {tab==='docs' && <>
            <div className="ps-title">Uploaded documents</div>
            <div className="card" style={{padding:'8px 12px',marginBottom:14}}>
              {client.documents.filter(d=>d.uploaded).map((doc,i)=>(
                <div className="portal-doc-row" key={i}>
                  <span className="pdr-icon">📄</span>
                  <span className="pdr-name">{doc.name}</span>
                  <span className="pdr-date">{doc.date}</span>
                </div>
              ))}
            </div>
            <label className="upload-zone">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}}
                onChange={e => handleFileChange(e, null)} />
              <div className="uz-icon">📤</div>
              <div className="uz-text">Upload more documents</div>
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
            ['Fee status', client.feePaid ? `Paid — ₹${client.feeAmount.toLocaleString()}` : `Pending — ₹${client.feeAmount.toLocaleString()}`],
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
