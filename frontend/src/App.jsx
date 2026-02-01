import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Ingredientes from './pages/Ingredientes';
import Platos from './pages/Platos';
import Planificador from './pages/Planificador';
import Usuarios from './pages/Usuarios';
import Login from './pages/Login';
import api from './api/client';

function ProtectedRoute({ children, adminOnly = false }) {
  const isAuthenticated = api.auth.isAuthenticated();
  const isAdmin = api.auth.isAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/planificador" replace />;
  }

  return children;
}

function Sidebar({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const user = api.auth.getUser();
  const isAdmin = api.auth.isAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 900) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleLogout() {
    api.auth.logout();
    navigate('/login');
  }

  function handleNavClick() {
    if (window.innerWidth < 900) {
      setIsMenuOpen(false);
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          🥗 <span>NutriOrxata</span>
        </div>
        <button
          type="button"
          className="menu-toggle"
          aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          aria-controls="sidebar-menu"
          onClick={() => setIsMenuOpen(prev => !prev)}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>
      <div id="sidebar-menu" className={`sidebar-menu ${isMenuOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>
          
          {isAdmin && (
            <>
              <NavLink
                to="/usuarios"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="nav-icon">👥</span>
                Usuarios
              </NavLink>
              <div className="nav-divider" />
              <NavLink
                to="/ingredientes"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="nav-icon">📦</span>
                Ingredientes
              </NavLink>
              <NavLink
                to="/platos"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="nav-icon">🍽️</span>
                Platos
              </NavLink>
              <div className="nav-divider" />
            </>
          )}
          
          <NavLink
            to="/planificador"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">📅</span>
            Planificador
          </NavLink>
        </nav>

        <div
          style={{
            marginTop: 'auto',
            padding: '16px',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: '8px'
            }}
          >
            👤 {user?.nombre || 'Usuario'}
            {isAdmin && <span className="badge badge-primary" style={{ marginLeft: '8px' }}>Admin</span>}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginBottom: '8px' }}
            onClick={onToggleTheme}
            type="button"
          >
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={handleLogout}
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}

function AppLayout({ theme, onToggleTheme }) {
  return (
    <div className="app">
      <Sidebar theme={theme} onToggleTheme={onToggleTheme} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute adminOnly>
              <Usuarios />
            </ProtectedRoute>
          } />
          <Route path="/ingredientes" element={
            <ProtectedRoute adminOnly>
              <Ingredientes />
            </ProtectedRoute>
          } />
          <Route path="/platos" element={
            <ProtectedRoute adminOnly>
              <Platos />
            </ProtectedRoute>
          } />
          <Route path="/planificador" element={
            <ProtectedRoute>
              <Planificador />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

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
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout theme={theme} onToggleTheme={toggleTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
