import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Ingredientes from './pages/Ingredientes';
import Platos from './pages/Platos';
import Planificador from './pages/Planificador'; // Worker Daily View
import GestionPlatos from './pages/GestionPlatos'; // Admin Meal Planner
import Usuarios from './pages/Usuarios';
import Login from './pages/Login';
import Entrenamiento from './pages/Entrenamiento';
import Perfil from './pages/Perfil';
import Ayuda from './pages/Ayuda';
import RutinasAdmin from './pages/RutinasAdmin';
import Mensajes from './pages/Mensajes';
import ClienteDetalle from './pages/ClienteDetalle';
import api from './api/client';

function ProtectedRoute({ children, adminOnly = false }) {
  const isAuthenticated = api.auth.isAuthenticated();
  const isAdmin = api.auth.isAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function Sidebar({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = api.auth.getUser();
  const isAdmin = api.auth.isAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 900) setIsMenuOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    api.auth.logout();
    navigate('/login');
  }

  return (
    <>
      <button
        type="button"
        className="menu-toggle btn-icon"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1000, background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {isMenuOpen ? 'X' : 'Menu'}
      </button>

      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <span>NutriOrxata</span>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1 }}>
          <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', fontWeight: 600 }}>
            Principal
          </div>
          
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/planificador" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>{isAdmin ? 'Planificador' : 'Mi Plan'}</span>
          </NavLink>

          {/* Client Specific */}
          {!isAdmin && (
            <NavLink to="/entrenamiento" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>Entrenamiento</span>
            </NavLink>
          )}

          {/* Admin Specific */}
          {isAdmin && (
            <>
              <div className="nav-divider" />
              <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', fontWeight: 600 }}>
                Administración
              </div>
              <NavLink to="/usuarios" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Clientes</span>
              </NavLink>
              <NavLink to="/mensajes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Mensajes</span>
              </NavLink>
              <NavLink to="/rutinas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Rutinas</span>
              </NavLink>
              <NavLink to="/ingredientes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Ingredientes</span>
              </NavLink>
              <NavLink to="/platos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Platos</span>
              </NavLink>
              <NavLink to="/gestion-platos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Gestion platos</span>
              </NavLink>
            </>
          )}

          <div className="nav-divider" />
          <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', fontWeight: 600 }}>
            Cuenta
          </div>
          
          <NavLink to="/perfil" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
             <span>Perfil</span>
          </NavLink>
          
          <NavLink to="/ayuda" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
             <span>Ayuda</span>
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.nombre?.[0] || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{user?.nombre || 'Usuario'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{isAdmin ? 'Admin' : 'Cliente'}</div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={onToggleTheme} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
              {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </button>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center', color: 'var(--accent-error)', borderColor: 'rgba(239,68,68,0.3)' }}>
              Salir
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function AppLayout({ theme, onToggleTheme }) {
  return (
    <div className="app">
      <Sidebar theme={theme} onToggleTheme={onToggleTheme} />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/planificador" element={<ProtectedRoute><Planificador /></ProtectedRoute>} />
          <Route path="/gestion-platos" element={<ProtectedRoute adminOnly><GestionPlatos /></ProtectedRoute>} />
          
          <Route path="/entrenamiento" element={<ProtectedRoute><Entrenamiento /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/ayuda" element={<ProtectedRoute><Ayuda /></ProtectedRoute>} />

          <Route path="/usuarios" element={<ProtectedRoute adminOnly><Usuarios /></ProtectedRoute>} />
          <Route path="/clientes/:id" element={<ProtectedRoute adminOnly><ClienteDetalle /></ProtectedRoute>} /> {/* New Route */}
          <Route path="/mensajes" element={<ProtectedRoute adminOnly><Mensajes /></ProtectedRoute>} />
          <Route path="/rutinas" element={<ProtectedRoute adminOnly><RutinasAdmin /></ProtectedRoute>} />
          <Route path="/ingredientes" element={<ProtectedRoute adminOnly><Ingredientes /></ProtectedRoute>} />
          <Route path="/platos" element={<ProtectedRoute adminOnly><Platos /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout theme={theme} onToggleTheme={toggleTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
