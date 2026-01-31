import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Ingredientes from './pages/Ingredientes';
import Platos from './pages/Platos';
import Familiares from './pages/Familiares';
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

function Sidebar() {
  const navigate = useNavigate();
  const user = api.auth.getUser();
  const isAdmin = api.auth.isAdmin();

  function handleLogout() {
    api.auth.logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        🥗 <span>NutriOrxata</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📊</span>
          Dashboard
        </NavLink>
        
        {isAdmin && (
          <>
            <NavLink to="/usuarios" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">👥</span>
              Usuarios
            </NavLink>
            <NavLink to="/ingredientes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📦</span>
              Ingredientes
            </NavLink>
            <NavLink to="/platos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">🍽️</span>
              Platos
            </NavLink>
            <NavLink to="/familiares" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">👨‍👩‍👧‍👦</span>
              Familiares
            </NavLink>
          </>
        )}
        
        <NavLink to="/planificador" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📅</span>
          Planificador
        </NavLink>
      </nav>

      <div style={{ 
        marginTop: 'auto', 
        padding: '16px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)',
          marginBottom: '8px'
        }}>
          👤 {user?.nombre || 'Usuario'}
          {isAdmin && <span className="badge badge-primary" style={{ marginLeft: '8px' }}>Admin</span>}
        </div>
        <button 
          className="btn btn-secondary btn-sm" 
          style={{ width: '100%' }}
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function AppLayout() {
  return (
    <div className="app">
      <Sidebar />
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
          <Route path="/familiares" element={
            <ProtectedRoute adminOnly>
              <Familiares />
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
