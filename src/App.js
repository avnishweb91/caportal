import { useState, useEffect, useMemo, useRef } from 'react';
import AdminPage from './pages/AdminPage';
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
import BalanceSheetPage from './pages/BalanceSheetPage';
import AcknowledgmentPage from './pages/AcknowledgmentPage';
import TemplatesPage from './pages/TemplatesPage';
import ClientFormModal from './components/ClientFormModal';
import { clients as seedClients } from './data/mockData';
import { generateToken } from './lib/utils';
import { getBillingStatus, ensureTrialStart, syncPlanFromSupabase } from './lib/billing';
import { supabase, syncProfileFromSupabase, loadClients, saveClients, deleteClient, deleteAllClients, loadPortalClient } from './lib/supabase';
import PlanSelectPage from './pages/PlanSelectPage';
import './App.css';

const getStoredClients = (userId) => {
  try {
    if (!userId) return seedClients; // demo account
    const s = localStorage.getItem(`ca_clients_${userId}`);
    return s ? JSON.parse(s) : [];
  }
  catch { return []; }
};
const getStoredAuth = () => {
  try { return JSON.parse(localStorage.getItem('ca_auth')); } catch { return null; }
};

export default function App() {
  // ALL hooks must be called unconditionally at the top
  const [user, setUser]               = useState(getStoredAuth);
  const [screen, setScreen]           = useState(() => getStoredAuth() ? 'dashboard' : 'landing');
  const [clients, setClients]         = useState(() => getStoredClients(getStoredAuth()?.id));
  const [selectedClient, setSelected] = useState(null);
  const [sidebarTab, setSidebarTab]   = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalMode, setModalMode]     = useState(null);
  const [editingClient, setEditing]   = useState(null);
  const [portalPreview, setPortalPreview] = useState(null);
  const [toast, setToast]             = useState(null);
  const [authTab, setAuthTab]         = useState('signin');
  const [clientsReady, setClientsReady] = useState(() => !supabase || !getStoredAuth()?.id);
  const [portalClient, setPortalClient] = useState(null);
  const [portalError, setPortalError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const clientSaveQueue = useRef(Promise.resolve());

  // Check URL for client portal token (must be after all hooks)
  const urlToken = useMemo(() => new URLSearchParams(window.location.search).get('portal'), []);
  const isAdminPath = useMemo(() => window.location.pathname === '/admin', []);
  const localPortalClient = useMemo(
    () => urlToken ? clients.find(c => c.portalToken === urlToken) : null,
    [urlToken, clients]
  );

  useEffect(() => {
    if (user?.id) localStorage.setItem(`ca_clients_${user.id}`, JSON.stringify(clients));
  }, [clients, user]);

  useEffect(() => {
    if (!user?.id || !supabase) { setClientsReady(true); return undefined; }
    let active = true;
    setClientsReady(false);
    (async () => {
      const remote = await loadClients(user.id);
      if (!active) return;
      if (remote.error) {
        setPortalError('');
        showToast(`Could not load saved clients: ${remote.error}`, 'error');
        return;
      }
      const cached = getStoredClients(user.id);
      if (remote.data.length) {
        const tokens = new Set(remote.data.map(client => client.portalToken));
        const missingFromDatabase = cached.filter(client => !tokens.has(client.portalToken));
        if (missingFromDatabase.length) {
          const merged = await saveClients(user.id, [...remote.data, ...missingFromDatabase]);
          if (active && !merged.error) setClients(merged.data);
          else if (active && merged.error) {
            setClients(remote.data);
            showToast(`Could not sync local clients: ${merged.error}`, 'error');
          }
        } else setClients(remote.data);
      } else {
        if (cached.length) {
          const migrated = await saveClients(user.id, cached);
          if (active && !migrated.error) setClients(migrated.data);
          else if (active && migrated.error) showToast(`Could not sync local clients: ${migrated.error}`, 'error');
        } else setClients([]);
      }
      if (active) setClientsReady(true);
    })();
    return () => { active = false; };
    // Loading must run only when the authenticated account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!clientsReady || !user?.id || !supabase) return;
    let active = true;
    const snapshot = clients;
    clientSaveQueue.current = clientSaveQueue.current.catch(() => {}).then(() => saveClients(user.id, snapshot)).then(result => {
      if (active && result.error) showToast(`Could not save client changes: ${result.error}`, 'error');
      if (active && result.data && result.data.some((c, i) => String(c.id) !== String(snapshot[i]?.id))) setClients(result.data);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, clientsReady, user?.id]);

  useEffect(() => {
    if (!urlToken) return undefined;
    if (!supabase) return undefined;
    let active = true;
    setPortalLoading(true);
    loadPortalClient(urlToken).then(result => {
      if (!active) return;
      setPortalClient(result.data);
      setPortalError(result.error || (result.data ? '' : 'This portal link is invalid or has expired.'));
      setPortalLoading(false);
    });
    return () => { active = false; };
  }, [urlToken]);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthTab('reset');
        setScreen('auth');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (u) => {
    setUser(u);
    setClients(getStoredClients(u.id));
    setClientsReady(!supabase || !u.id);
    if (u.email === 'avnishweb91@gmail.com') {
      localStorage.setItem('ca_billing', JSON.stringify({
        plan: 'firm',
        planExpiry: new Date(2099, 0, 1).toISOString(),
      }));
    } else {
      ensureTrialStart(u);
      syncPlanFromSupabase();
      syncProfileFromSupabase().then(data => {
        if (data) {
          const updated = { ...u, name: data.name || u.name, city: data.city, firm: data.firm_name };
          localStorage.setItem('ca_auth', JSON.stringify(updated));
          let storedSettings = {};
          try { storedSettings = JSON.parse(localStorage.getItem('ca_settings') || '{}'); } catch { /* discard malformed local settings */ }
          localStorage.setItem('ca_settings', JSON.stringify({
            ...storedSettings,
            upiId: data.upi_id || '',
            upiName: data.upi_name || '',
            razorpayRouteAccountId: data.razorpay_route_account_id || '',
          }));
          setUser(updated);
        }
      });
    }
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
    const map = { dashboard: 'dashboard', clients: 'dashboard', documents: 'documents', deadlines: 'deadlines', invoices: 'invoices', reminders: 'reminders', settings: 'settings', computation: 'computation', balancesheet: 'balancesheet', acknowledgments: 'acknowledgments', templates: 'templates' };
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
    if (user?.id && c?.portalToken && supabase) {
      clientSaveQueue.current = clientSaveQueue.current.catch(() => {}).then(() => deleteClient(user.id, c.portalToken)).then(({ error }) => {
        if (error) showToast(`Could not archive client: ${error}`, 'error');
      });
    }
    setClients(prev => prev.filter(c => c.id !== id));
    setScreen('dashboard'); setSidebarTab('dashboard'); setSelected(null);
    showToast(`${c?.name} archived`);
  };

  const clearAllClients = async () => {
    if (user?.id && supabase) {
      const result = await (clientSaveQueue.current = clientSaveQueue.current.catch(() => {}).then(() => deleteAllClients(user.id)));
      const { error } = result;
      if (error) { showToast(`Could not clear saved clients: ${error}`, 'error'); return; }
    }
    setClients([]);
    showToast('Client data cleared');
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

  // ── Admin route ───────────────────────────────────────────────────────────
  if (isAdminPath) {
    if (!user || authTab === 'reset') return <AuthPage onLogin={handleLogin} defaultTab={authTab === 'reset' ? 'reset' : 'signin'} onBack={() => { window.history.pushState({}, '', '/'); window.location.reload(); }} />;
    return <AdminPage user={user} />;
  }

  // ── Client-facing portal (no auth needed) ────────────────────────────────
  const publicPortalClient = supabase ? portalClient : localPortalClient;
  if (urlToken && (portalLoading || publicPortalClient || portalError)) {
    if (portalLoading) return <div className="portal-outer"><div className="portal-phone">Loading secure portal…</div></div>;
    if (!publicPortalClient) return <div className="portal-outer"><div className="portal-phone">{portalError || 'This portal link is invalid or has expired.'}</div></div>;
    return (
      <>
        <ClientPortal
          client={publicPortalClient}
          isClientView
          onDocumentUploaded={updated => setPortalClient(updated)}
          onReportPayment={client => setPortalClient(client)}
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
            user={user}
            billing={billing}
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
              user={user}
            />
          )}
          {screen === 'detail' && liveClient && (
            <ClientDetail
              client={liveClient}
              user={user}
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
              onReportPayment={updated => updateClient(updated.id, updated)}
              showToast={showToast}
            />
          )}
          {screen === 'invoices'  && <InvoicesPage  clients={clients} onUpdateClient={updateClient} onSelectClient={handleSelectClient} showToast={showToast} />}
          {screen === 'documents' && <DocumentsPage clients={clients} onSelectClient={handleSelectClient} />}
          {screen === 'deadlines' && <DeadlinesPage showToast={showToast} />}
          {screen === 'reminders' && <RemindersPage clients={clients} showToast={showToast} />}
          {screen === 'settings'     && <SettingsPage  user={user} setUser={setUser} clients={clients} onClearClients={clearAllClients} showToast={showToast} />}
          {screen === 'computation'  && <TaxComputationPage clients={clients} showToast={showToast} />}
          {screen === 'balancesheet'   && <BalanceSheetPage    clients={clients} showToast={showToast} />}
          {screen === 'acknowledgments' && <AcknowledgmentPage clients={clients} onUpdateClient={updateClient} showToast={showToast} onSelectClient={handleSelectClient} />}
          {screen === 'templates'       && <TemplatesPage />}
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
