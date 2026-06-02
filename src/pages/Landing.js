import './Landing.css';

const features = [
  { tag:'Core', tagClass:'feat-tag-blue', title:'Document collection portal', desc:'Each client gets a private link. They upload Form 16, bank statements, PAN, Aadhaar — you see everything in one organised folder. No more digging through WhatsApp.' },
  { tag:'Automation', tagClass:'feat-tag-green', title:'Auto WhatsApp reminders', desc:'Set a checklist per client. The tool auto-sends reminders until documents arrive. You stop typing "please share your Form 16" forever.' },
  { tag:'Deadlines', tagClass:'feat-tag-amber', title:'ITR & GST deadline calendar', desc:'Pre-loaded with every Indian tax deadline — ITR, GST, TDS, Advance Tax. Alerts fire 7 days before. Clients get notified too.' },
  { tag:'Tracking', tagClass:'feat-tag-blue', title:'Filing status per client', desc:'Clients check their own filing status without calling you. CA marks progress — documents pending → under review → draft ready → filed.' },
  { tag:'Billing', tagClass:'feat-tag-purple', title:'Fee invoices + UPI payments', desc:'Send professional invoices inside the portal. Clients pay via UPI or card. You track who has paid, who hasn\'t, and how much is outstanding.' },
  { tag:'Insights', tagClass:'feat-tag-green', title:'Practice analytics dashboard', desc:'Total clients filed, pending, fees collected, season progress. Understand your practice health at a glance every morning.' },
];

const plans = [
  { tier:'Starter', price:'₹799', period:'/month · up to 30 clients', features:['Document portal','WhatsApp reminders','Filing status tracker','ITR/GST deadline calendar','Email support'], highlight:false },
  { tier:'Pro', price:'₹1,799', period:'/month · up to 100 clients', features:['Everything in Starter','Draft return approval flow','Fee invoicing + UPI payments','Practice analytics dashboard','Priority support'], highlight:true },
  { tier:'Firm', price:'₹3,499', period:'/month · unlimited clients', features:['Everything in Pro','Multi-CA staff accounts','Custom branding & white-label','API access','Dedicated account manager'], highlight:false },
];

export default function Landing({ onGetStarted, onSignIn, user }) {
  return (
    <div className="landing">
      <nav className="land-nav">
        <div className="land-nav-logo">
          <div className="land-logo-box">CA</div>
          CAPortal
        </div>
        <div className="land-nav-links">
          {['Features','Pricing','About','Blog'].map(l => <button key={l} className="land-nav-link">{l}</button>)}
        </div>
        <div className="land-nav-actions">
          {user
            ? <button className="btn btn-primary btn-sm" onClick={onGetStarted}>Open dashboard →</button>
            : <>
                <button className="btn btn-ghost btn-sm" onClick={onSignIn}>Sign in</button>
                <button className="btn btn-primary btn-sm" onClick={() => onGetStarted('signup')}>Start free trial</button>
              </>
          }
        </div>
      </nav>

      <div className="hero">
        <div className="hero-badge"><div className="hero-badge-dot"/>&nbsp;Built exclusively for Indian CAs</div>
        <h1 className="hero-h1">Stop running your practice<br/>on <s>WhatsApp</s><br/>Start using <em>CAPortal.</em></h1>
        <p className="hero-sub">The only client workspace built for Indian CAs — document collection, ITR deadline tracking, and filing status management. All in one place.</p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => onGetStarted('signin')}>See the dashboard →</button>
          <button className="btn btn-ghost btn-lg">Watch 60s demo</button>
        </div>
      </div>

      <div className="stats-bar">
        {[['4L+','Registered CAs in India'],['₹0','WhatsApp doc chasing'],['2h','Saved per CA per day'],['47d','To ITR deadline']].map(([v,l])=>(
          <div className="stat-item" key={l}>
            <div className="stat-val"><span>{v}</span></div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      <div className="features">
        <div className="section-eyebrow">Features</div>
        <h2 className="section-h2">Everything your practice needs</h2>
        <p className="section-sub">Built around the real workflow of an Indian CA — not adapted from Western tools</p>
        <div className="feat-grid">
          {features.map((f,i) => (
            <div className="feat-card" key={i}>
              <div className={`feat-tag ${f.tagClass}`}>{f.tag}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pricing">
        <div className="section-eyebrow">Pricing</div>
        <h2 className="section-h2">Simple, honest pricing</h2>
        <p className="section-sub">14-day free trial on all plans. No credit card required.</p>
        <div className="pricing-grid">
          {plans.map((p,i) => (
            <div className={`pricing-card ${p.highlight?'highlight':''}`} key={i}>
              {p.highlight && <><div className="pricing-card-glow"/><div className="popular-tag">Most popular</div></>}
              <div className="pc-tier">{p.tier}</div>
              <div className="pc-price">{p.price}</div>
              <div className="pc-period">{p.period}</div>
              <div className="pc-divider"/>
              {p.features.map((f,j) => <div className="pc-feature" key={j}><span className="pc-check">✓</span>{f}</div>)}
              <button className={`btn ${p.highlight?'btn-primary':'btn-ghost'} btn-lg`} style={{width:'100%',justifyContent:'center',marginTop:20}}>
                Start free trial
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="cta-section">
        <h2 className="cta-h2">Ready to modernise your practice?</h2>
        <p className="cta-sub">Join CAs across India who've stopped managing clients on WhatsApp.</p>
        <button className="btn btn-primary btn-lg" onClick={() => onGetStarted('signup')}>Start for free — no credit card →</button>
      </div>

      <footer className="land-footer">
        <div className="footer-copy">© 2026 CAPortal. Built for Indian CAs.</div>
        <div className="footer-links">
          {['Privacy','Terms','Support','Status'].map(l=><button key={l} className="footer-link">{l}</button>)}
        </div>
      </footer>
    </div>
  );
}
