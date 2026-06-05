# CAPortal — Practice Management SaaS for Indian CAs

> Live at **[caportal.co](https://caportal.co)**  
> React 19 · Supabase · UPI · Dark theme · No UI framework

---

## What It Is

CAPortal replaces the WhatsApp + Excel workflow every Indian CA uses to manage clients. Each client gets a private portal link — they upload documents, check filing status, and pay fees. The CA sees everything in one dashboard.

**The problem it solves:** Every CA in India manages 50–200 clients over WhatsApp. Documents get lost. Deadlines get missed. Clients call every week asking "when will my ITR be filed?"

**Who it's for:** Individual CAs and small CA firms across India — Tier 1 cities first.

**Pricing:** ₹799 Starter → ₹1,799 Pro → ₹3,499 Firm · 14-day free trial

---

## What's Built

### CA-facing screens

| Screen | File | Description |
|---|---|---|
| Landing | `src/pages/Landing.js` | Marketing page — hero, features, pricing, social proof |
| Auth | `src/pages/AuthPage.js` | Sign in / sign up with Supabase auth + demo account |
| Dashboard | `src/pages/Dashboard.js` | Client list, search, filter by 7-step status, bulk remind, export CSV |
| Client Detail | `src/pages/ClientDetail.js` | Full client view — 7-step workflow pipeline, docs, timeline, ack card, invoice PDF |
| Invoices | `src/pages/InvoicesPage.js` | All fees — mark paid, collect via UPI |
| Documents | `src/pages/DocumentsPage.js` | All documents across all clients |
| Deadlines | `src/pages/DeadlinesPage.js` | ITR, GST, TDS deadlines with urgency badges |
| Reminders | `src/pages/RemindersPage.js` | WhatsApp reminder log + compose |
| Tax Computation | `src/pages/TaxComputationPage.js` | FY 2025-26 — both regimes, all income heads, CG Budget 2024 rates, advance tax, PDF |
| Balance Sheet Builder | `src/pages/BalanceSheetPage.js` | Trading A/c → P&L → Balance Sheet, auto-tally, Indian-format PDF |
| Acknowledgment Tracker | `src/pages/AcknowledgmentPage.js` | Store and search ITR ack nos., GST ARNs, TDS ref nos. per client |
| Templates | `src/pages/TemplatesPage.js` | 8 work type templates — ITR-1/2/3/4, GST, TDS, Company ITR |
| Settings | `src/pages/SettingsPage.js` | Profile, Billing, Integrations (UPI ID) |
| Plan Select | `src/pages/PlanSelectPage.js` | Subscription wall shown when trial expires |

### Client-facing screen

| Screen | File | Description |
|---|---|---|
| Client Portal | `src/pages/ClientPortal.js` | Mobile-first portal — docs, status, messaging, UPI payment |

Accessible via unique link: `caportal.co/?portal=TOKEN`

---

## Key Features

**Client portal magic link**
Every client gets a unique URL. CA copies it from Client Detail and sends via WhatsApp. Client opens it on phone — no app, no login. Uploads documents, pays fees, messages CA.

**7-step filing workflow**
Each client moves through a granular pipeline instead of coarse 4-step status:
`Waiting docs → Docs received → Computation done → Return prepared → Client approved → Filed → Ack received`
One-click advance button on Client Detail. Any step clickable to jump directly. Dashboard filter works across all 7 stages.

**Tax Computation Sheet**
FY 2025-26 computation supporting both old and new tax regimes, all income heads (salary, house property, capital gains with Budget 2024 LTCG/STCG rates, other sources), all deductions (80C–80U), and advance tax. Downloads as a professional PDF with CA stamp and client details.

**Balance Sheet Builder**
Three-tab form — Trading Account, P&L Account, Balance Sheet. Live summary panel updates as figures are entered. Auto-tally shows if assets = liabilities. Exports a professional T-account format PDF in Indian accounting style with CA signature block.

**Acknowledgment Tracker**
Per-client storage of ITR-V ack numbers, GST ARNs (GSTR-1/3B), TDS return tokens, and other filing references. Searchable across all clients simultaneously — search by name, PAN, ref number, or period. Type filters: ITR / GST / TDS / Other. Add from either the tracker page or directly from the client's detail card.

**Work Type Templates**
8 purpose-built document checklists — ITR-1 (Sahaj), ITR-2, ITR-3, ITR-4 (Sugam), GST Filing, GST + ITR, TDS Return, Company ITR. When adding a client, selecting a filing type shows its description and pre-loads the exact checklist. Templates page shows all 8 types with numbered document lists.

**Subscription billing**
14-day free trial → plan selection wall → Razorpay checkout
Webhook via Supabase Edge Function verifies payment and activates plan in database.

**UPI payments for client fees**
CA enters their UPI ID in Settings → Integrations. When client opens portal → "Pay ₹X" button opens GPay/PhonePe/Paytm on phone, or shows QR code on desktop. Money goes directly to CA's bank via NPCI. No API keys needed for CA.

**Real file upload**
Client taps upload zone → file picker opens → PDF/JPG/PNG selected → document marked received on CA's dashboard.

**Invoice PDF**
Client Detail → "Download invoice" → professional invoice opens in new tab → save as PDF.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 19 | No Router — single `screen` state in App.js |
| Styling | CSS custom properties | Dark theme, Geist + IBM Plex Mono |
| Database + Auth | Supabase (PostgreSQL) | Row Level Security on all tables |
| File storage | Supabase Storage | Ready to connect |
| CA subscription payments | Razorpay | Developer's account — CA pays ₹799/₹1,799/₹3,499 |
| Client fee payments | UPI direct | CA's UPI ID — zero commission, instant to CA's bank |
| Webhook | Supabase Edge Functions | `supabase/functions/razorpay-webhook/index.ts` |
| Email | Resend | Platform-handled, noreply@caportal.co |
| WhatsApp | Gupshup | Platform-handled, key pending |
| Hosting | Vercel | Auto-deploys on push to `develop` |

---

## Project Structure

```
caportal/
├── public/
│   ├── index.html          # SEO: meta, OG, Twitter cards, JSON-LD schema
│   ├── favicon.svg
│   ├── og-image.png        # Social sharing preview (1200×630)
│   ├── sitemap.xml
│   └── robots.txt
│
├── src/
│   ├── App.js              # Root: screen state, auth gate, billing gate, routing
│   │
│   ├── components/
│   │   ├── Navbar.js/css
│   │   ├── Sidebar.js/css  # Left nav — live counts, mobile overlay
│   │   └── ClientFormModal.js/css  # Add / edit client — PAN validation, template checklist preview
│   │
│   ├── pages/
│   │   ├── Landing.js/css
│   │   ├── AuthPage.js/css
│   │   ├── Dashboard.js/css            # 7-step status filters, metrics strip
│   │   ├── ClientDetail.js/css         # Workflow pipeline stepper, ack card, timeline
│   │   ├── ClientPortal.js/css         # UPI payment, real file upload, messaging
│   │   ├── InvoicesPage.js/css
│   │   ├── DocumentsPage.js
│   │   ├── DeadlinesPage.js
│   │   ├── RemindersPage.js
│   │   ├── TaxComputationPage.js/css   # FY 2025-26 computation, both regimes, PDF
│   │   ├── BalanceSheetPage.js/css     # Trading → P&L → BS, auto-tally, PDF
│   │   ├── AcknowledgmentPage.js/css   # Searchable ITR/GST/TDS ref tracker
│   │   ├── TemplatesPage.js/css        # Work type template cards
│   │   ├── SettingsPage.js/css
│   │   └── PlanSelectPage.js/css
│   │
│   ├── lib/
│   │   ├── billing.js              # Trial logic, plan storage, Supabase sync
│   │   ├── taxCalc.js              # Tax computation — both regimes, all heads
│   │   ├── computationPdf.js       # Tax computation PDF generator
│   │   ├── balanceSheet.js         # Trading/P&L/BS computation
│   │   ├── balanceSheetPdf.js      # Balance sheet T-account PDF generator
│   │   ├── workTypeTemplates.js    # 8 work type templates — single source of truth
│   │   ├── invoice.js              # Invoice PDF generator
│   │   ├── supabase.js             # Supabase client + auth helpers
│   │   ├── razorpay.js             # Razorpay checkout wrapper
│   │   └── utils.js                # Token generation, UPI links, clipboard
│   │
│   └── data/
│       └── mockData.js     # Seed clients (spread across 7-step pipeline), deadlines, reminders
│
├── supabase/
│   └── functions/
│       └── razorpay-webhook/
│           └── index.ts    # Edge Function: verify signature → activate plan
│
├── supabase-schema.sql     # Full DB schema — run in Supabase SQL Editor
├── .env.example
└── README.md
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Razorpay — developer's account (CA subscription payments)
REACT_APP_RAZORPAY_KEY=rzp_live_XXXXXXXXXX

# Supabase — database + auth
REACT_APP_SUPABASE_URL=https://your-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...

# Email (Resend) — platform-handled
REACT_APP_RESEND_KEY=re_XXXXXXXXXX

# WhatsApp (Gupshup) — platform-handled
REACT_APP_GUPSHUP_KEY=XXXXXXXXXX
```

Also set in **Vercel → Settings → Environment Variables** for production.

---

## Getting Started

```bash
npm install
npm start        # http://localhost:3000
npm run build
```

Demo login: `support@caportal.co` / `demo1234`

---

## Database Setup

1. Go to **supabase.com** → your project → SQL Editor
2. Paste contents of `supabase-schema.sql` → Run
3. Safe to re-run — uses `IF NOT EXISTS` and `OR REPLACE` throughout

---

## Webhook Setup (Razorpay → Supabase)

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_secret
npx supabase functions deploy razorpay-webhook --no-verify-jwt
```

Register in Razorpay → Settings → Webhooks:
- URL: `https://YOUR_REF.supabase.co/functions/v1/razorpay-webhook`
- Event: `payment.captured` only

---

## Payment Flow

**CA subscribes to CAPortal (money → developer)**
```
CA selects plan → Razorpay checkout → payment.captured
→ Browser activates plan in localStorage + Supabase immediately
→ Webhook (backup) verifies and activates in Supabase
→ Money lands in developer's Razorpay account
```

**Client pays CA's fee (money → CA)**
```
Client opens portal link → taps "Pay ₹X"
→ Mobile: opens GPay/PhonePe/Paytm with UPI deep link
→ Desktop: QR code popup to scan
→ Money goes directly to CA's bank via NPCI/UPI
→ No platform commission
```

---

## Design System

All tokens in `src/index.css`:

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#0a0a0a` | Page background |
| `--bg1` | `#111111` | Cards, sidebars |
| `--accent` | `#5b8af5` | Primary actions, links |
| `--green` | `#3dd68c` | Success, filed, ack received |
| `--amber` | `#f5a623` | Warnings, waiting docs |
| `--purple` | `#a78bfa` | Return prepared, client approved |
| `--red` | `#f56565` | Errors, missing docs |
| `--font` | Geist | All UI text |
| `--mono` | IBM Plex Mono | Numbers, PANs, dates, ref numbers |

---

## Roadmap

- [ ] Gupshup WhatsApp key → auto-reminders go live
- [ ] Supabase real-time → CA sees document uploads instantly
- [ ] Draft return approval — CA uploads PDF, client approves with one tap
- [ ] Multilingual client portal — Hindi, Tamil, Telugu, Kannada
- [ ] Multi-CA firm accounts — role-based access for staff
- [ ] Practice analytics — revenue charts, season heatmap
- [ ] Custom branding — white-label with CA firm logo

---

## Business Context

| Item | Detail |
|---|---|
| Live URL | caportal.co |
| Target | Individual CAs + small CA firms, Tier 1 Indian cities |
| Peak window | ITR season June–August |
| Pricing | ₹799 → ₹1,799 → ₹3,499/month |
| MRR target | ₹2.2L/month (100 Starter + 50 Pro + 15 Firm) |
| Moat | India-first, UPI-native, WhatsApp workflow — Western tools won't build this |

---

*React 19 · Supabase · Razorpay · UPI · Vercel · Dark theme*
