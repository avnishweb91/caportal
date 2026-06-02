export const clients = [
  {
    id: 1, name: "Priya Sharma", pan: "ABCPS1234D",
    phone: "+91 98765 43210", email: "priya@example.com",
    type: "Individual ITR", plan: "Pro", status: "under_review",
    docsReceived: 4, docsTotal: 5, feeAmount: 3500, feePaid: false,
    documents: [
      { name: "Form 16", uploaded: true, date: "Jun 1" },
      { name: "Bank statement (SBI)", uploaded: true, date: "Jun 1" },
      { name: "PAN card", uploaded: true, date: "May 28" },
      { name: "Aadhaar card", uploaded: true, date: "May 28" },
      { name: "Rent receipts", uploaded: false, date: null },
    ],
    timeline: [
      { action: "CA started review", time: "Today, 10:32 am", type: "blue" },
      { action: "Form 16 uploaded by client", time: "Jun 1, 6:14 pm", type: "green" },
      { action: "Reminder sent for rent receipts", time: "Jun 1, 9:00 am", type: "amber" },
      { action: "Bank statement uploaded", time: "Jun 1, 8:22 am", type: "green" },
      { action: "Client portal link sent", time: "May 27, 11:00 am", type: "gray" },
    ],
  },
  {
    id: 2, name: "Vikram Textiles", pan: "AABFV5678K",
    phone: "+91 97654 32109", email: "accounts@vikramtextiles.com",
    type: "GST + ITR", plan: "Starter", status: "docs_pending",
    docsReceived: 3, docsTotal: 5, feeAmount: 8000, feePaid: false,
    documents: [
      { name: "GST returns", uploaded: true, date: "May 30" },
      { name: "PAN card", uploaded: true, date: "May 25" },
      { name: "Aadhaar card", uploaded: true, date: "May 25" },
      { name: "Bank statement", uploaded: false, date: null },
      { name: "Balance sheet", uploaded: false, date: null },
    ],
    timeline: [
      { action: "2 reminders sent via WhatsApp", time: "Jun 2, 9:00 am", type: "amber" },
      { action: "GST returns uploaded", time: "May 30, 4:10 pm", type: "green" },
      { action: "Client portal link sent", time: "May 25, 10:00 am", type: "gray" },
    ],
  },
  {
    id: 3, name: "Anand Mehta", pan: "AAGPM9012F",
    phone: "+91 96543 21098", email: "anand.mehta@gmail.com",
    type: "Individual ITR", plan: "Starter", status: "filed",
    docsReceived: 4, docsTotal: 4, feeAmount: 2500, feePaid: true,
    documents: [
      { name: "Form 16", uploaded: true, date: "May 20" },
      { name: "Bank statement", uploaded: true, date: "May 20" },
      { name: "PAN card", uploaded: true, date: "May 18" },
      { name: "Aadhaar card", uploaded: true, date: "May 18" },
    ],
    timeline: [
      { action: "ITR filed successfully", time: "May 28, 3:45 pm", type: "green" },
      { action: "Client approved draft return", time: "May 27, 6:00 pm", type: "blue" },
      { action: "Draft return sent to client", time: "May 26, 2:00 pm", type: "blue" },
      { action: "All documents received", time: "May 20, 11:00 am", type: "green" },
    ],
  },
  {
    id: 4, name: "Sunita Reddy", pan: "AAQRS3456G",
    phone: "+91 95432 10987", email: "sunita.reddy@gmail.com",
    type: "Individual ITR", plan: "Pro", status: "waiting_docs",
    docsReceived: 3, docsTotal: 4, feeAmount: 3000, feePaid: false,
    documents: [
      { name: "Form 16", uploaded: true, date: "Jun 1" },
      { name: "PAN card", uploaded: true, date: "May 30" },
      { name: "Aadhaar card", uploaded: true, date: "May 30" },
      { name: "Interest certificate", uploaded: false, date: null },
    ],
    timeline: [
      { action: "Reminder sent for interest certificate", time: "Jun 2, 9:00 am", type: "amber" },
      { action: "Form 16 uploaded", time: "Jun 1, 7:30 pm", type: "green" },
      { action: "Client portal link sent", time: "May 30, 10:00 am", type: "gray" },
    ],
  },
  {
    id: 5, name: "Kavitha Nair", pan: "AACPN4567H",
    phone: "+91 94321 09876", email: "kavitha.nair@gmail.com",
    type: "Individual ITR", plan: "Starter", status: "waiting_docs",
    docsReceived: 1, docsTotal: 4, feeAmount: 2000, feePaid: false,
    documents: [
      { name: "PAN card", uploaded: true, date: "Jun 2" },
      { name: "Form 16", uploaded: false, date: null },
      { name: "Bank statement", uploaded: false, date: null },
      { name: "Aadhaar card", uploaded: false, date: null },
    ],
    timeline: [
      { action: "Portal link sent via WhatsApp", time: "Jun 2, 10:02 am", type: "gray" },
      { action: "Client added to portal", time: "Jun 2, 10:00 am", type: "gray" },
    ],
  },
  {
    id: 6, name: "Suresh Patel", pan: "AABFP3456J",
    phone: "+91 93210 98765", email: "suresh.patel@gmail.com",
    type: "GST + ITR", plan: "Pro", status: "docs_pending",
    docsReceived: 2, docsTotal: 6, feeAmount: 9500, feePaid: false,
    documents: [
      { name: "GST returns", uploaded: true, date: "May 28" },
      { name: "PAN card", uploaded: true, date: "May 28" },
      { name: "Form 16", uploaded: false, date: null },
      { name: "Aadhaar card", uploaded: false, date: null },
      { name: "Bank statement", uploaded: false, date: null },
      { name: "Balance sheet", uploaded: false, date: null },
    ],
    timeline: [
      { action: "GST returns uploaded", time: "May 28, 3:00 pm", type: "green" },
      { action: "Portal link sent", time: "May 28, 11:00 am", type: "gray" },
    ],
  },
  {
    id: 7, name: "Meera Joshi", pan: "AAIPJ7890L",
    phone: "+91 92109 87654", email: "meera.joshi@gmail.com",
    type: "Individual ITR", plan: "Starter", status: "filed",
    docsReceived: 4, docsTotal: 4, feeAmount: 2000, feePaid: true,
    documents: [
      { name: "Form 16", uploaded: true, date: "May 15" },
      { name: "Bank statement", uploaded: true, date: "May 15" },
      { name: "PAN card", uploaded: true, date: "May 14" },
      { name: "Aadhaar card", uploaded: true, date: "May 14" },
    ],
    timeline: [
      { action: "ITR filed successfully", time: "May 22, 2:00 pm", type: "green" },
      { action: "All documents received", time: "May 15, 10:00 am", type: "green" },
      { action: "Portal link sent", time: "May 12, 9:00 am", type: "gray" },
    ],
  },
  {
    id: 8, name: "Ravi Shankar Enterprises", pan: "AABCR1234M",
    phone: "+91 91098 76543", email: "accounts@ravishankar.in",
    type: "Company ITR", plan: "Firm", status: "under_review",
    docsReceived: 5, docsTotal: 7, feeAmount: 25000, feePaid: false,
    documents: [
      { name: "Balance sheet", uploaded: true, date: "Jun 1" },
      { name: "P&L statement", uploaded: true, date: "Jun 1" },
      { name: "TDS certificates", uploaded: true, date: "May 30" },
      { name: "PAN card", uploaded: true, date: "May 25" },
      { name: "GST returns", uploaded: true, date: "May 25" },
      { name: "Board resolution", uploaded: false, date: null },
      { name: "Bank statement", uploaded: false, date: null },
    ],
    timeline: [
      { action: "CA started review", time: "Jun 2, 9:30 am", type: "blue" },
      { action: "Balance sheet uploaded", time: "Jun 1, 5:00 pm", type: "green" },
      { action: "5 documents received", time: "May 30, 4:00 pm", type: "green" },
      { action: "Portal link sent", time: "May 25, 10:00 am", type: "gray" },
    ],
  },
];

export const deadlines = [
  { id: 1, name: "GST GSTR-1", date: "June 11, 2026", daysLeft: 9, urgency: "urgent", category: "GST" },
  { id: 2, name: "Advance tax Q1", date: "June 15, 2026", daysLeft: 13, urgency: "urgent", category: "Income Tax" },
  { id: 3, name: "GST GSTR-3B", date: "June 20, 2026", daysLeft: 18, urgency: "soon", category: "GST" },
  { id: 4, name: "TDS Q1 return", date: "July 31, 2026", daysLeft: 59, urgency: "ok", category: "TDS" },
  { id: 5, name: "ITR filing deadline", date: "July 31, 2026", daysLeft: 59, urgency: "ok", category: "Income Tax" },
  { id: 6, name: "GST Annual return", date: "December 31, 2026", daysLeft: 212, urgency: "ok", category: "GST" },
];

export const reminderLog = [
  { id: 1, clientId: 2, clientName: "Vikram Textiles", message: "Please upload bank statement and balance sheet for your ITR filing.", sentAt: "Jun 2, 9:00 am", via: "WhatsApp", status: "delivered" },
  { id: 2, clientId: 4, clientName: "Sunita Reddy", message: "Interest certificate is the last document needed. Please share at your earliest.", sentAt: "Jun 2, 9:00 am", via: "WhatsApp", status: "delivered" },
  { id: 3, clientId: 5, clientName: "Kavitha Nair", message: "Welcome to CAPortal! Please upload your Form 16 and other documents via the link.", sentAt: "Jun 2, 10:05 am", via: "WhatsApp", status: "sent" },
  { id: 4, clientId: 6, clientName: "Suresh Patel", message: "Reminder: Please share the remaining 4 documents for timely filing.", sentAt: "Jun 1, 9:00 am", via: "WhatsApp", status: "delivered" },
  { id: 5, clientId: 2, clientName: "Vikram Textiles", message: "Please upload your pending documents. ITR deadline is approaching.", sentAt: "May 31, 9:00 am", via: "WhatsApp", status: "read" },
];

export const docsByType = {
  'Individual ITR': ['Form 16', 'PAN card', 'Aadhaar card', 'Bank statement', 'Interest certificate'],
  'GST Only': ['GST certificates', 'Sales invoices', 'Purchase invoices', 'PAN card', 'Bank statement'],
  'GST + ITR': ['Form 16', 'GST returns', 'PAN card', 'Aadhaar card', 'Bank statement', 'Balance sheet'],
  'Company ITR': ['Balance sheet', 'P&L statement', 'TDS certificates', 'PAN card', 'GST returns', 'Board resolution', 'Bank statement'],
  'Partnership': ['Partnership deed', 'Balance sheet', 'P&L statement', 'PAN card', 'Bank statement'],
};
