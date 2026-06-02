import { useState, useEffect } from 'react';
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
import ClientFormModal from './components/ClientFormModal';
import { clients as seedClients } from './data/mockData';
import './App.css';

// ── Helpers ────────────────────────────────────────────────────────────────
const getStoredClients = () => {
  try {
    const s = localStorage.getItem('ca_clients');
    return s ? JSON.parse(s) : seedClients;
  } catch { return seedClients; }
};

const getStoredAuth = () => {
  try { return JSON.parse(localStorage.getItem('ca_auth')); }
  catch { return null; }
};

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]                 = useState(getStoredAuth);
  const [screen, setScreen]             = useState(() => user ? 'dashboard' : 'landing');
  const [clients, setClients]           = useState(getStoredClients);
  const [selectedClient, setSelected]   = useState(null);
  const [sidebarTab, setSidebarTab]     = useState('dashboard');
  const [authTab, setAuthTab]           = useState('signin');
  const [modalMode, setModalMode]       = useState(null);
  const [editingClient, setEditing]     = useState(null);
  const [portalClient, setPortalClient] = useState(null);
  const [toast, setToast]               = useState(null);

  // Persist clients to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ca_clients', JSON.stringify(clients));
  }, [clients]);

  // ── Toast ──────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Auth ───────────────────────────────────────────────────────────────
  const handleLogin = (userData) => {
    setUser(userData);
    setScreen('dashboard');
    setSidebarTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('ca_auth');
    setUser(null);
    setScreen('landing');
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const goTo = (s, tab) => {
    if (!user && s !== 'landing' && s !== 'auth') {
      setAuthTab(tab || 'signin');
      setScreen('auth');
      return;
    }
    if (s === 'auth') { setAuthTab(tab || 'signin'); }
    setScreen(s);
    if (s !== 'detail') setSelected(null);
  };

  const handleSidebarSelect = (tab) => {
    setSidebarTab(tab);
    const map = { dashboard: 'dashboard', clients: 'dashboard', documents: 'documents', deadlines: 'deadlines', invoices: 'invoices', reminders: 'reminders' };
    setScreen(map[tab] || 'dashboard');
    setSelected(null);
  };

  const handleSelectClient = (client) => {
    setSelected(clients.find(c => c.id === client.id) || client);
    setScreen('detail');
    setSidebarTab('clients');
  };

  // ── Client CRUD ─────────────────────────────────────────────────────────
  const addClient = (data) => {
    const newClient = {
      id: Date.now(), ...data,
      status: 'waiting_docs', docsReceived: 0, feePaid: false,
      timeline: [{ action: 'Client added to portal', time: 'Just now', type: 'gray' }],
    };
    setClients(prev => [...prev, newClient]);
    setModalMode(null);
    showToast(`${data.name} added successfully`);
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
    if (modalMode === 'edit' && editingClient) {
      updateClient(editingClient.id, data);
      showToast(`${data.name} updated`);
    } else {
      addClient(data);
    }
    setModalMode(null); setEditing(null);
  };

  // ── Derived state ────────────────────────────────────────────────────────
  const liveClient = selectedClient
    ? (clients.find(c => c.id === selectedClient.id) || selectedClient)
    : null;

  const showSidebar = user && !['landing', 'portal', 'auth'].includes(screen);

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (screen === 'auth' || (!user && screen !== 'landing')) {
    return <AuthPage onLogin={handleLogin} defaultTab={authTab} />;
  }

  return (
    <div className="app-root">
      {screen !== 'landing' && (
        <Navbar
          currentScreen={screen}
          setScreen={goTo}
          user={user}
          onLogout={handleLogout}
        />
      )}
      <div className="app-body">
        {showSidebar && (
          <Sidebar active={sidebarTab} onSelect={handleSidebarSelect} clients={clients} />
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
            />
          )}
          {screen === 'detail' && liveClient && (
            <ClientDetail
              client={liveClient}
              onBack={() => { setScreen('dashboard'); setSidebarTab('dashboard'); setSelected(null); }}
              onUpdateClient={updateClient}
              onArchive={archiveClient}
              onEdit={c => { setEditing(c); setModalMode('edit'); }}
              onViewPortal={c => { setPortalClient(c); goTo('portal'); }}
              onGoInvoices={() => { setScreen('invoices'); setSidebarTab('invoices'); }}
              showToast={showToast}
            />
          )}
          {screen === 'portal' && (
            <ClientPortal
              client={portalClient || clients[0]}
              onBack={() => goTo('dashboard')}
              showToast={showToast}
            />
          )}
          {screen === 'invoices' && (
            <InvoicesPage
              clients={clients}
              onUpdateClient={updateClient}
              onSelectClient={handleSelectClient}
              showToast={showToast}
            />
          )}
          {screen === 'documents' && (
            <DocumentsPage clients={clients} onSelectClient={handleSelectClient} />
          )}
          {screen === 'deadlines' && <DeadlinesPage showToast={showToast} />}
          {screen === 'reminders' && (
            <RemindersPage clients={clients} showToast={showToast} />
          )}
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
