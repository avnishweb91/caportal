import { useState } from 'react';
import './Landing.css';

const features = [
  { tag:'Core', tagClass:'feat-tag-blue', title:'Document collection portal', desc:'Each client gets a private link. They upload Form 16, bank statements, PAN, Aadhaar — you see everything in one organised folder. No more digging through WhatsApp.' },
  { tag:'Automation', tagClass:'feat-tag-green', title:'Auto WhatsApp reminders', desc:'Set a checklist per client. The tool auto-sends reminders until documents arrive. You stop typing "please share your Form 16" forever.' },
  { tag:'Deadlines', tagClass:'feat-tag-amber', title:'ITR & GST deadline calendar', desc:'Pre-loaded with every Indian tax deadline — ITR, GST, TDS, Advance Tax. Alerts fire 7 days before. Clients get notified too.' },
  { tag:'Tracking', tagClass:'feat-tag-blue', title:'Filing status per client', desc:'Clients check their own filing status without calling you. CA marks progress — documents pending → under review → draft ready → filed.' },
  { tag:'Billing', tagClass:'feat-tag-purple', title:'Fee invoices + UPI payments', desc:"Send professional invoices inside the portal. Clients pay via UPI or card. You track who has paid, who hasn't, and how much is outstanding." },
  { tag:'Insights', tagClass:'feat-tag-green', title:'Practice analytics dashboard', desc:'Total clients filed, pending, fees collected, season progress. Understand your practice health at a glance every morning.' },
];

const plans = [
  { tier:'Starter', price:'₹799', period:'/month · up to 30 clients', features:['Document portal','WhatsApp reminders','Filing status tracker','ITR/GST deadline calendar','Email support'], highlight:false },
  { tier:'Pro', price:'₹1,799', period:'/month · up to 100 clients', features:['Everything in Starter','Draft return approval flow','Fee invoicing + UPI payments','Practice analytics dashboard','Priority support'], highlight:true },
  { tier:'Firm', price:'₹3,499', period:'/month · unlimited clients', features:['Everything in Pro','Multi-CA staff accounts','Custom branding & white-label','API access','Dedicated account manager'], highlight:false },
];

// ── Modal content ──────────────────────────────────────────────────────────

const MODALS = {
  about: {
    title: 'About CAPortal',
    content: (
      <div className="lm-body">
        <p className="lm-lead">CAPortal is India's first practice management platform built exclusively for Chartered Accountants — not adapted from Western tools, not a generic CRM.</p>

        <h3>The problem we solve</h3>
        <p>Every CA in India manages 50–200 clients over WhatsApp and Excel. Documents get lost in chat threads. Clients call every week asking "when will my ITR be filed?" Deadlines are tracked in handwritten diaries. Fees are chased over text.</p>
        <p>We replace all of that with one clean, professional workspace.</p>

        <h3>What we built</h3>
        <ul>
          <li>Private document portal for each client — they upload, you receive</li>
          <li>Auto WhatsApp reminders so you stop chasing documents manually</li>
          <li>ITR, GST, TDS deadline calendar pre-loaded for the Indian tax calendar</li>
          <li>Filing status clients can check themselves — zero calls</li>
          <li>Fee invoicing with UPI + card payments built in</li>
        </ul>

        <h3>Who we are</h3>
        <p>CAPortal is built by a team that has worked closely with CA firms across Tier 1 Indian cities. We understand the seasonal pressure of ITR season, the pain of document follow-ups, and the need for a tool that works in Indian context — WhatsApp-native, bilingual-ready, and affordable.</p>

        <h3>Contact us</h3>
        <p>📧 <a href="mailto:support@caportal.co">support@caportal.co</a></p>
        <p>🌐 caportal.co</p>
        <p style={{marginTop:12,fontSize:11,color:'var(--text3)'}}>© 2026 CAPortal. All rights reserved.</p>
      </div>
    ),
  },

  blog: {
    title: 'Blog — CA Practice Tips',
    content: (
      <div className="lm-body">
        <p className="lm-lead">Practical articles for Indian CAs on managing clients, meeting deadlines, and growing your practice.</p>

        {[
          { tag:'ITR Season', date:'Jun 1, 2026', title:'How to collect Form 16 from 100 clients without a single WhatsApp chase', desc:'A step-by-step system using document portals and automated reminders to get all docs before the July 31 deadline.' },
          { tag:'GST', date:'May 20, 2026', title:'5 GST filing mistakes your clients make — and how to prevent them', desc:'Common errors in GSTR-1 and GSTR-3B that lead to notices, and the document checklist that prevents all of them.' },
          { tag:'Practice Growth', date:'May 10, 2026', title:'From 30 to 120 clients — how a Bengaluru CA scaled her practice without hiring', desc:'How systematising the document collection process freed up 15 hours a week during peak season.' },
        ].map((post, i) => (
          <div key={i} className="lm-blog-card">
            <div className="lm-blog-meta">
              <span className="lm-blog-tag">{post.tag}</span>
              <span className="lm-blog-date">{post.date}</span>
            </div>
            <div className="lm-blog-title">{post.title}</div>
            <div className="lm-blog-desc">{post.desc}</div>
            <button className="lm-blog-read">Read article →</button>
          </div>
        ))}

        <div className="lm-blog-cta">
          <p>New articles every week. Follow us on LinkedIn for updates.</p>
          <a href="mailto:support@caportal.co?subject=Blog subscription">Get articles by email →</a>
        </div>
      </div>
    ),
  },

  privacy: {
    title: 'Privacy Policy',
    content: (
      <div className="lm-body lm-legal">
        <p className="lm-lead">Last updated: June 2026</p>

        <h3>1. Information we collect</h3>
        <p>When you use CAPortal, we collect:</p>
        <ul>
          <li><strong>Account information:</strong> Name, email address, firm name, city</li>
          <li><strong>Client data:</strong> Client names, PAN numbers, phone, email, document metadata you add to the platform</li>
          <li><strong>Uploaded documents:</strong> Files uploaded by your clients via their portal (stored securely on Supabase Storage)</li>
          <li><strong>Payment records:</strong> Invoice amounts and payment status (actual card/UPI details are handled by Razorpay and never stored on our servers)</li>
          <li><strong>Usage data:</strong> Pages visited, actions taken, browser type — used to improve the product</li>
        </ul>

        <h3>2. How we use your information</h3>
        <ul>
          <li>To provide and operate the CAPortal service</li>
          <li>To send transactional emails (filing confirmations, reminders)</li>
          <li>To send WhatsApp reminders to your clients on your behalf</li>
          <li>To generate invoices and process payments</li>
          <li>To improve the product and fix bugs</li>
        </ul>

        <h3>3. Data storage and security</h3>
        <p>Your data is stored on Supabase (PostgreSQL + Storage), hosted on AWS Mumbai region. All data is encrypted in transit (TLS) and at rest. We use Row Level Security — each CA can only access their own clients' data.</p>

        <h3>4. Data sharing</h3>
        <p>We do not sell your data. We share it only with:</p>
        <ul>
          <li><strong>Razorpay</strong> — for payment processing</li>
          <li><strong>Gupshup</strong> — for WhatsApp message delivery</li>
          <li><strong>Resend</strong> — for email delivery</li>
        </ul>

        <h3>5. Client data (your clients' information)</h3>
        <p>You are the data controller for your clients' information. CAPortal processes it on your behalf as a data processor. You are responsible for obtaining appropriate consent from your clients to process their tax documents.</p>

        <h3>6. Your rights</h3>
        <p>You may request deletion of your account and all associated data at any time by emailing support@caportal.co. We will process the request within 7 working days.</p>

        <h3>7. Contact</h3>
        <p>Privacy queries: <a href="mailto:support@caportal.co">support@caportal.co</a></p>
      </div>
    ),
  },

  terms: {
    title: 'Terms of Service',
    content: (
      <div className="lm-body lm-legal">
        <p className="lm-lead">Last updated: June 2026. By using CAPortal, you agree to these terms.</p>

        <h3>1. The service</h3>
        <p>CAPortal provides a practice management platform for Chartered Accountants registered in India. The service includes client document collection, deadline tracking, filing status management, and fee invoicing.</p>

        <h3>2. Eligibility</h3>
        <p>CAPortal is intended for use by licensed Chartered Accountants and CA firms registered with ICAI. By signing up, you confirm you are a licensed CA or are authorised to act on behalf of a CA firm.</p>

        <h3>3. Subscription and billing</h3>
        <ul>
          <li>Plans are billed monthly. You may cancel at any time.</li>
          <li>The 14-day free trial requires no credit card. After the trial, a plan must be selected to continue.</li>
          <li>Payments are processed by Razorpay. Refunds are considered on a case-by-case basis within 7 days of billing.</li>
          <li>Plan pricing is shown in INR and is subject to GST as applicable.</li>
        </ul>

        <h3>4. Your responsibilities</h3>
        <ul>
          <li>You are responsible for the accuracy of client data entered into the platform</li>
          <li>You must not use CAPortal to store data unrelated to tax and compliance services</li>
          <li>You must not share your login credentials with parties outside your firm</li>
          <li>You are responsible for obtaining your clients' consent to use the portal</li>
        </ul>

        <h3>5. Client portal usage</h3>
        <p>Portal links sent to your clients are unique and private. You are responsible for ensuring these links are shared only with the intended client. CAPortal is not liable for unauthorised access resulting from shared links.</p>

        <h3>6. Limitation of liability</h3>
        <p>CAPortal is a workflow tool. We are not responsible for filing errors, missed deadlines, or tax notices. The CA remains solely responsible for the accuracy and timeliness of all tax filings.</p>

        <h3>7. Termination</h3>
        <p>We may suspend accounts that violate these terms. You may close your account at any time via Settings → Data → Clear all data, and email support@caportal.co for full deletion.</p>

        <h3>8. Governing law</h3>
        <p>These terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.</p>

        <h3>9. Contact</h3>
        <p><a href="mailto:support@caportal.co">support@caportal.co</a></p>
      </div>
    ),
  },

  support: {
    title: 'Support',
    content: (
      <div className="lm-body">
        <p className="lm-lead">We're here to help. Reach us via email or WhatsApp — we respond within 4 hours on working days.</p>

        <div className="lm-support-cards">
          <div className="lm-support-card">
            <div className="lm-sc-icon">📧</div>
            <div className="lm-sc-title">Email support</div>
            <div className="lm-sc-desc">For account issues, billing, and feature requests</div>
            <a href="mailto:support@caportal.co" className="lm-sc-link">support@caportal.co</a>
          </div>
          <div className="lm-support-card">
            <div className="lm-sc-icon">💬</div>
            <div className="lm-sc-title">WhatsApp</div>
            <div className="lm-sc-desc">Quick help during ITR season</div>
            <div className="lm-sc-link">Coming soon</div>
          </div>
        </div>

        <div className="lm-hours">
          <div className="lm-hours-title">Support hours</div>
          <div className="lm-hours-row"><span>Monday – Saturday</span><span>9:00 am – 6:00 pm IST</span></div>
          <div className="lm-hours-row"><span>Sunday</span><span>Closed (emergency email only)</span></div>
        </div>

        <h3>Frequently asked questions</h3>

        {[
          ['How does the client portal link work?', 'When you add a client in CAPortal, a unique private link is generated. Copy it from the client detail page and send it via WhatsApp. Your client opens the link on their phone — no app download, no login needed — and they can upload documents and check their filing status.'],
          ['Can clients pay their fee through the portal?', 'Yes. If you have a Razorpay account, add your API key in Settings → Integrations. A "Pay now" button will appear in the client portal showing the fee amount. Clients can pay via UPI, debit/credit card, or netbanking.'],
          ['Is my clients\' data secure?', 'All data is encrypted in transit and at rest. Each CA account is fully isolated — you can only see your own clients\' data. We use Supabase with Row Level Security on all tables.'],
          ['How do I migrate from my current Excel/WhatsApp workflow?', 'Start by adding your top 5 clients in CAPortal. Send them their portal links. Once you see how document collection works, add the rest. Most CAs migrate fully within one week.'],
          ['What happens to my data if I cancel?', 'Your data remains accessible for 30 days after cancellation. You can export a full backup (Settings → Data → Export) at any time. After 30 days, data is permanently deleted.'],
        ].map(([q, a], i) => (
          <div key={i} className="lm-faq">
            <div className="lm-faq-q">{q}</div>
            <div className="lm-faq-a">{a}</div>
          </div>
        ))}
      </div>
    ),
  },

  status: {
    title: 'System Status',
    content: (
      <div className="lm-body">
        <div className="lm-status-hero">
          <div className="lm-status-dot lm-status-green" />
          <div>
            <div className="lm-status-title">All systems operational</div>
            <div className="lm-status-sub">Last checked: just now · No active incidents</div>
          </div>
        </div>

        <div className="lm-services">
          {[
            ['CAPortal App', 'caportal.co', 'operational'],
            ['Authentication', 'Supabase Auth', 'operational'],
            ['Database', 'Supabase PostgreSQL', 'operational'],
            ['File Storage', 'Supabase Storage', 'operational'],
            ['Payments', 'Razorpay Checkout', 'operational'],
            ['Email', 'Resend', 'operational'],
            ['WhatsApp', 'Gupshup API', 'operational'],
          ].map(([name, provider, status]) => (
            <div key={name} className="lm-service-row">
              <div>
                <div className="lm-svc-name">{name}</div>
                <div className="lm-svc-provider">{provider}</div>
              </div>
              <div className="lm-svc-status">
                <div className={`lm-status-dot lm-status-${status === 'operational' ? 'green' : 'amber'}`} />
                <span>{status === 'operational' ? 'Operational' : 'Degraded'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lm-uptime">
          <div className="lm-uptime-row"><span>Uptime last 30 days</span><span style={{color:'var(--green)',fontWeight:700}}>99.9%</span></div>
          <div className="lm-uptime-row"><span>Last incident</span><span>None</span></div>
          <div className="lm-uptime-row"><span>Incident history</span><span>No incidents in the past 90 days</span></div>
        </div>

        <p style={{fontSize:11,color:'var(--text3)',marginTop:16}}>For real-time status updates, email support@caportal.co</p>
      </div>
    ),
  },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function Landing({ onGetStarted, onSignIn, user }) {
  const [activeModal, setActiveModal] = useState(null);
  const modal = activeModal ? MODALS[activeModal] : null;

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navLinks = [
    { label: 'Features', action: () => scrollTo('features') },
    { label: 'Pricing',  action: () => scrollTo('pricing')  },
    { label: 'About',    action: () => setActiveModal('about') },
    { label: 'Blog',     action: () => setActiveModal('blog')  },
  ];

  const footerLinks = [
    { label: 'Privacy', key: 'privacy' },
    { label: 'Terms',   key: 'terms'   },
    { label: 'Support', key: 'support' },
    { label: 'Status',  key: 'status'  },
  ];

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="land-nav">
        <div className="land-nav-logo">
          <div className="land-logo-box">CA</div>
          CAPortal
        </div>
        <div className="land-nav-links">
          {navLinks.map(l => (
            <button key={l.label} className="land-nav-link" onClick={l.action}>{l.label}</button>
          ))}
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

      {/* HERO */}
      <div className="hero">
        <div className="hero-badge"><div className="hero-badge-dot"/>&nbsp;Built exclusively for Indian CAs</div>
        <h1 className="hero-h1">Stop running your practice<br/>on <s>WhatsApp</s><br/>Start using <em>CAPortal.</em></h1>
        <p className="hero-sub">The only client workspace built for Indian CAs — document collection, ITR deadline tracking, and filing status management. All in one place.</p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => onGetStarted('signin')}>See the dashboard →</button>
          <button className="btn btn-ghost btn-lg" onClick={() => setActiveModal('about')}>Learn more</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-bar">
        {[['4L+','Registered CAs in India'],['₹0','WhatsApp doc chasing'],['2h','Saved per CA per day'],['47d','To ITR deadline']].map(([v,l])=>(
          <div className="stat-item" key={l}>
            <div className="stat-val"><span>{v}</span></div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div className="features" id="features">
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

      {/* PRICING */}
      <div className="pricing" id="pricing">
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
              <button className={`btn ${p.highlight?'btn-primary':'btn-ghost'} btn-lg`}
                style={{width:'100%',justifyContent:'center',marginTop:20}}
                onClick={() => onGetStarted('signup')}>
                Start free trial
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <h2 className="cta-h2">Ready to modernise your practice?</h2>
        <p className="cta-sub">Join CAs across India who've stopped managing clients on WhatsApp.</p>
        <button className="btn btn-primary btn-lg" onClick={() => onGetStarted('signup')}>
          Start for free — no credit card →
        </button>
      </div>

      {/* FOOTER */}
      <footer className="land-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="land-logo-box">CA</div>
              CAPortal
            </div>
            <p className="footer-brand-desc">
              Practice management built exclusively for Indian CAs.<br />
              Document portal · Deadlines · Invoicing · WhatsApp reminders.
            </p>
            <div className="footer-social">
              <a href="https://www.linkedin.com/company/caportal" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                LinkedIn
              </a>
              <a href="https://twitter.com/caportal_in" target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter / X">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Twitter / X
              </a>
              <a href="https://www.instagram.com/caportal.co" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                Instagram
              </a>
              <a href="https://www.youtube.com/@caportal" target="_blank" rel="noopener noreferrer" className="social-link" title="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0a0a0a"/></svg>
                YouTube
              </a>
            </div>
          </div>

          <div className="footer-cols">
            <div className="footer-col">
              <div className="footer-col-title">Product</div>
              <button className="footer-col-link" onClick={() => scrollTo('features')}>Features</button>
              <button className="footer-col-link" onClick={() => scrollTo('pricing')}>Pricing</button>
              <button className="footer-col-link" onClick={() => setActiveModal('blog')}>Blog</button>
              <button className="footer-col-link" onClick={() => onGetStarted('signup')}>Start free trial</button>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Company</div>
              <button className="footer-col-link" onClick={() => setActiveModal('about')}>About us</button>
              <button className="footer-col-link" onClick={() => setActiveModal('support')}>Support</button>
              <button className="footer-col-link" onClick={() => setActiveModal('status')}>Status</button>
              <a className="footer-col-link" href="mailto:support@caportal.co">Contact</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Legal</div>
              <button className="footer-col-link" onClick={() => setActiveModal('privacy')}>Privacy policy</button>
              <button className="footer-col-link" onClick={() => setActiveModal('terms')}>Terms of service</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">© 2026 CAPortal. Built for Indian CAs. · support@caportal.co</div>
          <div className="footer-links">
            {footerLinks.map(l => (
              <button key={l.key} className="footer-link" onClick={() => setActiveModal(l.key)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal lm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal.title}</span>
              <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            {modal.content}
          </div>
        </div>
      )}
    </div>
  );
}
