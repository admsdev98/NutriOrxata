import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Ingredientes from './pages/Ingredientes';
import Platos from './pages/Platos';
import Planificador from './pages/Planificador';
import PlanificadorTrabajoPage from './pages/PlanificadorTrabajoPage';
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
  const rawUser = api.auth.getUser();
  const user = api.auth.getEffectiveUser();
  const isAdmin = api.auth.isAdmin();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');
  const [roleOverride, setRoleOverride] = useState(() => api.auth.getRoleOverride());

  useEffect(() => {
    function handleResize() {
      // Collapsed sidebar is a desktop-only behavior.
      if (window.innerWidth < 900) setIsCollapsed(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
  }, [isCollapsed]);

  function handleLogout() {
    api.auth.logout();
    navigate('/login');
  }

  function handleToggleRole() {
    const next = roleOverride === 'cliente' ? null : 'cliente';
    api.auth.setRoleOverride(next);
    setRoleOverride(next);
    navigate('/dashboard');
  }

  return (
    <>
      {isCollapsed && (
        <button
          type="button"
          className="sidebar-expand-toggle btn-icon"
          onClick={() => setIsCollapsed(false)}
          title="Expandir navbar"
          aria-label="Expandir navbar"
          style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 1000, background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          &gt;&gt;
        </button>
      )}

      {!isCollapsed && (
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <span>NutriOrxata</span>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={() => setIsCollapsed(true)}
            title="Contraer navbar"
            aria-label="Contraer navbar"
            style={{ border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
          >
            &lt;&lt;
          </button>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1 }}>
          <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', fontWeight: 600 }}>
            Principal
          </div>
          
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>Inicio</span>
          </NavLink>

          <NavLink
            to={isAdmin ? '/planificador-trabajo' : '/plan-nutricional'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>{isAdmin ? 'Planificador de trabajo' : 'Mi Plan'}</span>
          </NavLink>

          {/* Client Specific */}
          {!isAdmin && (
            <NavLink to="/entrenamiento" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span>Entrenamientos</span>
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

              <div className="nav-divider" />
              <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', fontWeight: 600 }}>
                Planificación clientes
              </div>
              <NavLink to="/gestion-platos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Asignar menús semanales</span>
              </NavLink>
              <NavLink to="/rutinas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Asignar entrenamientos</span>
              </NavLink>

              <div className="nav-divider" />
              <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', fontWeight: 600 }}>
                Bases
              </div>
              <NavLink to="/ingredientes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Ingredientes base</span>
              </NavLink>
              <NavLink to="/platos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span>Platos base</span>
              </NavLink>
            </>
          )}

          <div className="nav-divider" />
          <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', fontWeight: 600 }}>
            Ajustes
          </div>
          
          <NavLink to="/perfil" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
             <span>Perfil</span>
          </NavLink>
          
          <NavLink to="/ayuda" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
             <span>Ayuda</span>
          </NavLink>

          {import.meta.env.DEV && rawUser?.rol === 'admin' && (
            <button
              type="button"
              className="nav-link"
              onClick={handleToggleRole}
              style={{ textAlign: 'left', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}
              title="Solo local: alterna la interfaz entre admin y cliente"
            >
              <span>{roleOverride === 'cliente' ? 'Volver a admin' : 'Cambiar a cliente'}</span>
            </button>
          )}
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
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'center' }}
              title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
            >
              {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </button>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center', color: 'var(--accent-error)', borderColor: 'rgba(239,68,68,0.3)' }}>
              Salir
            </button>
          </div>
        </div>
      </aside>
      )}
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
          <Route path="/plan-nutricional" element={<ProtectedRoute><Planificador /></ProtectedRoute>} />
          <Route path="/planificador-trabajo" element={<ProtectedRoute adminOnly><PlanificadorTrabajoPage /></ProtectedRoute>} />
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
