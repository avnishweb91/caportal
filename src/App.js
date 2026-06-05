import { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ClientDetail from './pages/ClientDetail';
import ClientPortal from './pages/ClientPortal';
import InvoicesPage from './pages/InvoicesPage';
import DocumentsPage from './pages/DocumentsPage';
import DeadlinesPage from './pages/DeadlinesPage';
import RemindersPage from './pages/RemindersPage';
import SettingsPage from './pages/SettingsPage';
import TaxComputationPage from './pages/TaxComputationPage';
import ClientFormModal from './components/ClientFormModal';
import { clients as seedClients } from './data/mockData';
import { generateToken } from './lib/utils';
import { getBillingStatus, ensureTrialStart, syncPlanFromSupabase } from './lib/billing';
import PlanSelectPage from './pages/PlanSelectPage';
import './App.css';

const getStoredClients = () => {
  try { const s = localStorage.getItem('ca_clients'); return s ? JSON.parse(s) : seedClients; }
  catch { return seedClients; }
};
const getStoredAuth = () => {
  try { return JSON.parse(localStorage.getItem('ca_auth')); } catch { return null; }
};

export default function App() {
  // ALL hooks must be called unconditionally at the top
  const [user, setUser]               = useState(getStoredAuth);
  const [screen, setScreen]           = useState(() => getStoredAuth() ? 'dashboard' : 'landing');
  const [clients, setClients]         = useState(getStoredClients);
  const [selectedClient, setSelected] = useState(null);
  const [sidebarTab, setSidebarTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalMode, setModalMode]     = useState(null);
  const [editingClient, setEditing]   = useState(null);
  const [portalPreview, setPortalPreview] = useState(null);
  const [toast, setToast]             = useState(null);
  const [authTab, setAuthTab]         = useState('signin');

  // Check URL for client portal token (must be after all hooks)
  const urlToken = useMemo(() => new URLSearchParams(window.location.search).get('portal'), []);
  const portalAccessClient = useMemo(
    () => urlToken ? clients.find(c => c.portalToken === urlToken) : null,
    [urlToken, clients]
  );

  useEffect(() => {
    localStorage.setItem('ca_clients', JSON.stringify(clients));
  }, [clients]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (u) => {
    setUser(u);
    ensureTrialStart(u);
    syncPlanFromSupabase(); // pull latest plan from Supabase (async, no-wait)
    setScreen('dashboard');
    setSidebarTab('dashboard');
  };
  const handleLogout = () => {
    localStorage.removeItem('ca_auth'); setUser(null); setScreen('landing');
  };

  const goTo = (s, tab) => {
    if (!user && s !== 'landing' && s !== 'auth') { setAuthTab(tab || 'signin'); setScreen('auth'); return; }
    if (s === 'auth') setAuthTab(tab || 'signin');
    setScreen(s);
    if (s !== 'detail') setSelected(null);
    setSidebarOpen(false);
  };

  const handleSidebarSelect = (tab) => {
    setSidebarTab(tab);
    const map = { dashboard: 'dashboard', clients: 'dashboard', documents: 'documents', deadlines: 'deadlines', invoices: 'invoices', reminders: 'reminders', settings: 'settings', computation: 'computation' };
    setScreen(map[tab] || 'dashboard');
    setSelected(null);
    setSidebarOpen(false);
  };

  const handleSelectClient = (client) => {
    setSelected(clients.find(c => c.id === client.id) || client);
    setScreen('detail');
    setSidebarTab('clients');
    setSidebarOpen(false);
  };

  const addClient = (data) => {
    const c = { id: Date.now(), portalToken: generateToken(), ...data, status: 'waiting_docs', docsReceived: 0, feePaid: false, timeline: [{ action: 'Client added to portal', time: 'Just now', type: 'gray' }] };
    setClients(prev => [...prev, c]);
    setModalMode(null);
    showToast(`${data.name} added — portal link ready`);
  };

  const updateClient = (id, updates) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (selectedClient?.id === id) setSelected(prev => ({ ...prev, ...updates }));
  };

  const archiveClient = (id) => {
    const c = clients.find(c => c.id === id);
    setClients(prev => prev.filter(c => c.id !== id));
    setScreen('dashboard'); setSidebarTab('dashboard'); setSelected(null);
    showToast(`${c?.name} archived`);
  };

  const handleFormSave = (data) => {
    if (modalMode === 'edit' && editingClient) { updateClient(editingClient.id, data); showToast(`${data.name} updated`); }
    else addClient(data);
    setModalMode(null); setEditing(null);
  };

  const handleDocumentUploaded = (clientId, docName, fileInfo) => {
    updateClient(clientId, {
      documents: (clients.find(c => c.id === clientId)?.documents || []).map(d =>
        d.name === docName ? { ...d, uploaded: true, date: 'Just now', fileInfo } : d
      ),
      docsReceived: (clients.find(c => c.id === clientId)?.documents || []).filter(d => d.uploaded).length + 1,
      timeline: [
        { action: `${docName} uploaded by client`, time: 'Just now', type: 'green' },
        ...(clients.find(c => c.id === clientId)?.timeline || []),
      ],
    });
  };

  // ── Billing gate ──────────────────────────────────────────────────────
  const billing = user ? getBillingStatus() : null;

  if (billing?.isHardBlocked && !['portal', 'auth', 'landing'].includes(screen)) {
    return (
      <PlanSelectPage
        billing={billing}
        user={user}
        onActivate={(planId) => {
          showToast(`${planId.charAt(0).toUpperCase() + planId.slice(1)} plan activated — welcome! 🎉`);
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ── Client-facing portal (no auth needed) ────────────────────────────────
  if (portalAccessClient) {
    return (
      <>
        <ClientPortal
          client={portalAccessClient}
          isClientView
          onDocumentUploaded={handleDocumentUploaded}
          showToast={showToast}
        />
        {toast && (
          <div className={`app-toast app-toast-${toast.type}`}>
            <span className="toast-icon">{toast.type === 'success' ? '✓' : '✗'}</span>
            {toast.msg}
          </div>
        )}
      </>
    );
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (screen === 'auth' || (!user && screen !== 'landing')) {
    return <AuthPage onLogin={handleLogin} defaultTab={authTab} onBack={() => setScreen('landing')} />;
  }

  const liveClient = selectedClient
    ? (clients.find(c => c.id === selectedClient.id) || selectedClient)
    : null;
  const showSidebar = user && !['landing', 'portal', 'auth', 'plan'].includes(screen);

  return (
    <div className="app-root">
      {screen !== 'landing' && (
        <Navbar
          currentScreen={screen}
          setScreen={goTo}
          user={user}
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          showMenu={showSidebar}
        />
      )}
      <div className="app-body">
        {showSidebar && (
          <Sidebar
            active={sidebarTab}
            onSelect={handleSidebarSelect}
            clients={clients}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        {showSidebar && sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}
        <main className="app-main">
          {screen === 'landing' && (
            <Landing
              onGetStarted={(tab) => user ? goTo('dashboard') : goTo('auth', tab || 'signup')}
              onSignIn={() => goTo('auth', 'signin')}
              user={user}
            />
          )}
          {screen === 'dashboard' && (
            <Dashboard
              clients={clients}
              onSelectClient={handleSelectClient}
              onAddClient={() => { setEditing(null); setModalMode('add'); }}
              onUpdateClient={updateClient}
              showToast={showToast}
              billing={billing}
              onUpgrade={() => { setScreen('settings'); setSidebarTab('settings'); }}
            />
          )}
          {screen === 'detail' && liveClient && (
            <ClientDetail
              client={liveClient}
              onBack={() => { setScreen('dashboard'); setSidebarTab('dashboard'); setSelected(null); }}
              onUpdateClient={updateClient}
              onArchive={archiveClient}
              onEdit={c => { setEditing(c); setModalMode('edit'); }}
              onViewPortal={c => { setPortalPreview(c); goTo('portal'); }}
              onGoInvoices={() => { setScreen('invoices'); setSidebarTab('invoices'); }}
              showToast={showToast}
            />
          )}
          {screen === 'portal' && (
            <ClientPortal
              client={portalPreview || clients[0]}
              onBack={() => goTo('dashboard')}
              onDocumentUploaded={handleDocumentUploaded}
              showToast={showToast}
            />
          )}
          {screen === 'invoices'  && <InvoicesPage  clients={clients} onUpdateClient={updateClient} onSelectClient={handleSelectClient} showToast={showToast} />}
          {screen === 'documents' && <DocumentsPage clients={clients} onSelectClient={handleSelectClient} />}
          {screen === 'deadlines' && <DeadlinesPage showToast={showToast} />}
          {screen === 'reminders' && <RemindersPage clients={clients} showToast={showToast} />}
          {screen === 'settings'     && <SettingsPage  user={user} setUser={setUser} showToast={showToast} />}
          {screen === 'computation'  && <TaxComputationPage clients={clients} showToast={showToast} />}
        </main>
      </div>

      {modalMode && (
        <ClientFormModal
          client={modalMode === 'edit' ? editingClient : null}
          onSave={handleFormSave}
          onClose={() => { setModalMode(null); setEditing(null); }}
        />
      )}

      {toast && (
        <div className={`app-toast app-toast-${toast.type}`}>
          <span className="toast-icon">{toast.type === 'success' ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
