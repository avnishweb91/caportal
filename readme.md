# CAPortal — CA Client Management SaaS

> Production-ready React MVP for a SaaS product built for Indian Chartered Accountants.  
> Replaces WhatsApp-based client workflows with a professional dark-themed portal.

---

## What This Project Is

CAPortal was designed and built from scratch as a validated SaaS idea for the Indian market.

**The problem**: Every CA in India manages 50–200 clients over WhatsApp and Excel. Documents get lost, deadlines get missed, clients call to ask "when will my ITR be filed?" dozens of times a season.

**The solution**: A dedicated client workspace — document collection, ITR/GST deadline tracking, filing status management, and fee invoicing — in one place.

**The gap we fill**: Western tools (Broadly, Birdeye, Reputation.com) are $300–500/month, English-only, built for US workflows. Indian tools are basic templates with no AI. We sit exactly in that gap — India-first, WhatsApp-native, affordable.

---

## Design System

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#0a0a0a` | Page background |
| `--bg1` | `#111111` | Cards, sidebars, navbars |
| `--bg2` | `#1a1a1a` | Hover states, table rows |
| `--bg3` | `#222222` | Active states, inputs |
| `--accent` | `#5b8af5` | Primary actions, links |
| `--green` | `#3dd68c` | Success, filed status |
| `--amber` | `#f5a623` | Warnings, pending |
| `--red` | `#f56565` | Errors, missing docs |
| `--purple` | `#a78bfa` | Secondary accent |
| `--font` | Geist | All UI text |
| `--mono` | IBM Plex Mono | Numbers, PANs, dates, codes |

All tokens are defined in `src/index.css` as CSS custom properties.
To change the accent color across the entire app, change `--accent` in one place.

---

## Screens

### 1. Landing page (`src/pages/Landing.js`)
Marketing page for CAs to sign up.

**Sections:**
- Sticky navbar with sign in / start trial CTAs
- Hero with strikethrough typography (`Stop running your practice on ~~WhatsApp~~`)
- Stats bar: 4L+ CAs, ₹0 WhatsApp chasing, 2h saved/day, 47d to deadline
- 6-feature grid with colour-coded category tags
- 3-tier pricing table (Starter ₹799, Pro ₹1,799, Firm ₹3,499)
- CTA section with radial glow background
- Footer with links

### 2. CA Dashboard (`src/pages/Dashboard.js`)
Daily command center for the CA.

**Sections:**
- Toolbar with breadcrumb + season countdown + bulk action buttons
- 4-tile metrics strip: Total clients, Filed, Docs missing, Fees pending
- Client table with: checkboxes (bulk select), name+PAN, filing type, doc progress bar, status pill, action buttons
- Right panel: Upcoming deadlines with urgency badges, recent activity feed
- Season progress bar with gradient fill

**Interactive:**
- Search clients by name or PAN (live filter)
- Checkbox multi-select for bulk reminders/export
- Click any row → navigates to Client Detail

### 3. Client Detail (`src/pages/ClientDetail.js`)
Full view for a single client.

**Sections:**
- Header bar with back button + Edit / Archive / Mark as filed actions
- Hero: client name, PAN, phone, email, status chips, fee chip
- 4-tile info row: Filing type, Fee amount (paid/unpaid), Docs count, Plan
- Document checklist card: each doc with upload status icon, date, action
- Activity timeline card: colour-coded dots, timestamps in monospace
- Pinned bottom action bar: Send WhatsApp, Create invoice, Resend portal link, Download docs, Flag issue

### 4. Client Portal (`src/pages/ClientPortal.js`)
Mobile-first portal that the CA's clients see.

**Tabs:**
- **Home**: Document checklist + upload zone (tap to upload, shows success toast)
- **Docs**: All uploaded files with dates
- **Status**: Step-by-step filing progress tracker
- **Message**: Live chat UI with CA (functional — type and send messages)

**Desktop context panel**: Shows client info summary + explanation note beside the phone mockup.

---

## Project Structure

```
caportal/
├── public/
│   └── index.html
├── src/
│   ├── App.js              # Root: screen state, routing, layout
│   ├── App.css             # App shell layout
│   ├── index.js            # React entry point
│   ├── index.css           # Global CSS variables, base styles, shared classes
│   │
│   ├── components/
│   │   ├── Navbar.js       # Top bar — logo, screen tabs, status dot, avatar
│   │   ├── Navbar.css
│   │   ├── Sidebar.js      # Left nav — workspace items, plan indicator, profile
│   │   └── Sidebar.css
│   │
│   ├── pages/
│   │   ├── Landing.js      # Marketing landing page
│   │   ├── Landing.css
│   │   ├── Dashboard.js    # CA dashboard
│   │   ├── Dashboard.css
│   │   ├── ClientDetail.js # Single client view
│   │   ├── ClientDetail.css
│   │   ├── ClientPortal.js # Client-facing mobile portal
│   │   └── ClientPortal.css
│   │
│   └── data/
│       └── mockData.js     # All mock data — replace with API calls
│
├── package.json
└── README.md               ← you are here
```

---

## Getting Started

### Requirements
- Node.js 18+
- npm 9+

### Run locally
```bash
# Install dependencies
npm install

# Start dev server
npm start
# Opens at http://localhost:3000
```

### Build for production
```bash
npm run build
# Output in /build — deploy to Vercel, Netlify, or any static host
```

### Deploy to Vercel (1 command)
```bash
npm install -g vercel
vercel --prod
```

---

## Routing

No React Router — navigation uses a single `screen` state in `App.js`.

```js
// App.js — current routing logic
const [screen, setScreen] = useState('landing');

{screen === 'landing'   && <Landing />}
{screen === 'dashboard' && <Dashboard />}
{screen === 'detail'    && <ClientDetail client={selectedClient} />}
{screen === 'portal'    && <ClientPortal />}
```

When the app grows beyond 6 screens, add `react-router-dom` and convert each screen to a route.

---

## Mock Data

All data lives in `src/data/mockData.js`. Each client object shape:

```js
{
  id: 1,
  name: "Priya Sharma",
  pan: "ABCPS1234D",
  phone: "+91 98765 43210",
  email: "priya@example.com",
  type: "Individual ITR",         // filing type
  plan: "Pro",                     // subscription tier
  status: "under_review",         // filed | under_review | docs_pending | waiting_docs
  docsReceived: 4,
  docsTotal: 5,
  feeAmount: 3500,
  feePaid: false,
  documents: [
    { name: "Form 16", uploaded: true, date: "Jun 1" },
    { name: "Rent receipts", uploaded: false, date: null },
  ],
  timeline: [
    { action: "CA started review", time: "Today, 10:32 am", type: "blue" },
  ],
}
```

When you connect a real backend, replace the `import { clients } from '../data/mockData'` in Dashboard and ClientDetail with API calls. Component interfaces stay the same.

---

## Shared CSS Classes (index.css)

```css
/* Buttons */
.btn .btn-primary .btn-ghost .btn-danger .btn-sm .btn-lg .btn-icon

/* Status pills */
.pill .pill-green .pill-amber .pill-red .pill-blue .pill-purple .pill-gray

/* Input */
.input  /* dark styled input, focus ring on accent */

/* Card */
.card   /* bg1 background + border + border-radius */
```

Use these everywhere — don't create one-off button or pill styles in component CSS files.

---

## Planned Backend Stack (Phase 2)

| Layer | Choice | Reason |
|---|---|---|
| Database + Auth | Supabase (PostgreSQL) | Auth + DB + file storage in one, free tier covers MVP |
| File storage | Supabase Storage | Secure, handles PDFs and images, integrates with auth |
| WhatsApp API | Gupshup | India-first, cheaper than Twilio, WhatsApp Business API |
| Payments | Razorpay | Best India gateway — UPI, cards, subscriptions |
| Email | Resend | Simple API, great deliverability |
| Hosting | Vercel | One-command deploys, free SSL |

---

## Phase 2 Features (not yet built)

These were designed but deferred until first 50 paying customers:

- **WhatsApp auto-reminders** — Gupshup API sends document reminders on a schedule
- **Draft return approval** — CA uploads PDF draft, client approves with one tap
- **UPI invoice + payment** — Razorpay inside portal, full payment tracking
- **Multilingual client portal** — Hindi, Kannada, Tamil, Telugu (key India moat)
- **Multi-CA firm accounts** — role-based access for firm staff
- **Custom branding** — white-label with CA firm logo and colours
- **Practice analytics** — monthly filings, revenue charts, busy period heatmap
- **Bulk WhatsApp campaigns** — send season-start messages to all clients at once

---

## Business Context

| Item | Detail |
|---|---|
| Target customer | Individual CAs + small CA firms, Tier 1 Indian cities |
| Primary pain | Managing 50–200 clients on WhatsApp — lost docs, missed deadlines |
| Peak window | ITR season June–August — highest pain, highest conversion |
| Acquisition | ICAI chapters, CA WhatsApp groups, LinkedIn — word of mouth |
| Pricing | ₹799 Starter → ₹1,799 Pro → ₹3,499 Firm |
| 2-year MRR target | ₹2.2L/month (100 Starter + 50 Pro + 15 Firm) |
| Moat | India-first, WhatsApp-native, multilingual — Western tools won't build this |

---

## Roadmap — Next Steps

- *"Add Supabase backend — auth, database schema, and file upload"*
- *"Add React Router and build a dedicated Invoices page"*
- *"Integrate Gupshup WhatsApp API for document reminders"*
- *"Build the Razorpay invoice + payment flow inside the client portal"*
- *"Add Hindi and Kannada language support to the client portal"*
- *"Build multi-CA firm accounts with role-based access"*

---

*React 19 · Geist + IBM Plex Mono · Dark theme · CSS custom properties · No UI framework*  
*Version 2 — full dark UI rebuild (Linear/Vercel aesthetic)*