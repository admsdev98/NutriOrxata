import { useState, useEffect } from 'react';
import api from '../api/client';
import UserProfileModal from '../components/UserProfileModal';
import UserGoalsModal from '../components/UserGoalsModal';
import UserPlatosModal from '../components/UserPlatosModal';

const OBJECTIVE_LABELS = {
  mantenimiento: 'Mantenimiento',
  definicion: 'Definicion',
  volumen: 'Volumen',
};

function formatObjective(value) {
  if (!value) return '';
  const normalized = `${value}`.toLowerCase();
  if (OBJECTIVE_LABELS[normalized]) return OBJECTIVE_LABELS[normalized];
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

function Usuarios() {
  const ENABLE_PLATOS_BUTTON = true;
  // State for Admins
  const [admins, setAdmins] = useState([]);
  
  // State for Clients (with pagination)
  const [clientes, setClientes] = useState([]);
  const [clientPage, setClientPage] = useState(1);
  const [clientTotal, setClientTotal] = useState(0);
  const [clientSearch, setClientSearch] = useState('');
  const LIMIT = 10;

  // Shared State
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showPlatosModal, setShowPlatosModal] = useState(false);
  const isModalOpen = showCreateModal || showProfileModal || showGoalsModal || showPlatosModal;
  
  // Form state for creation
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'cliente',
  });
  const [error, setError] = useState('');
  const currentUser = api.auth.getUser();

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isModalOpen]);

  // Effect to reload clients when page or search changes
  useEffect(() => {
    loadClients();
  }, [clientPage, clientSearch]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const adminsData = await api.auth.listUsers({ rol: 'admin' });
      setAdmins(adminsData.items || []);
      await loadClients();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      setLoadingClients(true);
      const skip = (clientPage - 1) * LIMIT;
      const response = await api.auth.listUsers({
        rol: 'cliente',
        skip,
        limit: LIMIT,
        search: clientSearch
      });
      
      setClientes(response.items || []);
      setClientTotal(response.total || 0);
    } catch (err) {
      console.error("Error loading clients:", err);
    } finally {
      setLoadingClients(false);
    }
  }

  function handleSearchChange(e) {
    setClientSearch(e.target.value);
    setClientPage(1); // Reset to first page on search
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    try {
      const payload = {
        ...formData,
        rol: formData.rol === 'usuario' ? 'cliente' : formData.rol
      };
      
      await api.auth.register(payload);
      setShowCreateModal(false);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'cliente',
      });
      
      // Reload appropriate list
      if (payload.rol === 'admin') {
        const adminsData = await api.auth.listUsers({ rol: 'admin' });
        setAdmins(adminsData.items || []);
      } else {
        loadClients();
      }
      
    } catch (err) {
      setError(err.message || 'Error al crear usuario');
    }
  }

  async function handleDelete(id, isClient) {
    const confirmMessage = isClient
      ? '¿Estás seguro de ELIMINAR este cliente?'
      : '¿Estás seguro de ELIMINAR este usuario?';
    if (!window.confirm(confirmMessage)) return;
    try {
      await api.auth.deleteUser(id);
      if (isClient) {
        loadClients();
      } else {
        const adminsData = await api.auth.listUsers({ rol: 'admin' });
        setAdmins(adminsData.items || []);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleActive(u, isClient) {
    try {
      await api.auth.updateUser(u.id, { activo: !u.activo });
      if (isClient) {
        loadClients(); // Reload to reflect changes if needed
        // Or optimistically update:
        setClientes(prev => prev.map(c => c.id === u.id ? {...c, activo: !c.activo} : c));
      } else {
        setAdmins(prev => prev.map(a => a.id === u.id ? {...a, activo: !a.activo} : a));
      }
    } catch (err) {
      alert("Error al cambiar estado: " + err.message);
    }
  }

  const openProfile = (u) => {
    setSelectedUser(u);
    setShowProfileModal(true);
  };

  const openGoals = (u) => {
    setSelectedUser(u);
    setShowGoalsModal(true);
  };

  const openPlatos = (u) => {
    setSelectedUser(u);
    setShowPlatosModal(true);
  };

  // Helper for icons
  const Icons = {
    Trash: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    ),
    User: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ),
    Target: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    ),
    Search: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    ),
    Plus: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    ),
    Plate: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M8 7h8"/></svg>
    )
  };

  const ClientRow = ({ user }) => (
    <div className="usuarios-row">
      <div className="usuarios-cell usuarios-cell-main">
        <div className="usuarios-row-title">{user.nombre} {user.apellidos}</div>
        <div className="usuarios-row-sub text-muted">{user.email}</div>
      </div>
      <div className="usuarios-cell">
        {user.objetivo ? (
          <span className="badge badge-secondary text-xs">{formatObjective(user.objetivo)}</span>
        ) : (
          <span className="text-muted text-xs">Sin Objetivo</span>
        )}
      </div>
      <div className="usuarios-cell">
        <button
          type="button"
          className={`badge ${user.activo ? 'badge-primary' : 'badge-danger'} usuarios-status-btn`}
          onClick={() => toggleActive(user, true)}
        >
          {user.activo ? 'Activo' : 'Inactivo'}
        </button>
      </div>
      <div className="usuarios-cell usuarios-cell-actions">
        <button 
          className="btn btn-outline btn-sm user-action-btn"
          onClick={() => openProfile(user)}
          title="Editar Perfil"
        >
          <Icons.User /> Perfil
        </button>
        <button 
          className="btn btn-outline btn-sm user-action-btn"
          onClick={() => openGoals(user)}
          title="Objetivos"
        >
          <Icons.Target /> Objetivos
        </button>
        {ENABLE_PLATOS_BUTTON && (
        <button 
          className="btn btn-outline btn-sm user-action-btn"
          onClick={() => openPlatos(user)}
          title="Planificador de platos semanales"
        >
          <Icons.Plate /> Planificador semanal
        </button>
        )}
        <button 
          className="btn btn-outline btn-sm user-action-btn user-action-delete"
          onClick={() => handleDelete(user.id, true)}
          title="Eliminar"
        >
          <Icons.Trash /> Eliminar
        </button>
      </div>
    </div>
  );

  const AdminRow = ({ user }) => (
    <div className="usuarios-row">
      <div className="usuarios-cell usuarios-cell-main">
        <div className="usuarios-row-title">{user.nombre} {user.apellidos}</div>
        <div className="usuarios-row-sub text-muted">{user.email}</div>
      </div>
      <div className="usuarios-cell">
        <span className="badge badge-primary text-xs">{user.rol}</span>
      </div>
      <div className="usuarios-cell">
        <button
          type="button"
          className={`badge ${user.activo ? 'badge-primary' : 'badge-danger'} usuarios-status-btn`}
          onClick={() => toggleActive(user, false)}
        >
          {user.activo ? 'Activo' : 'Inactivo'}
        </button>
      </div>
      <div className="usuarios-cell usuarios-cell-actions">
        <button
          className="btn btn-outline btn-sm user-action-btn"
          onClick={() => openProfile(user)}
          title="Editar Perfil"
        >
          <Icons.User /> Perfil
        </button>
        <button
          className="btn btn-outline btn-sm user-action-btn user-action-delete"
          onClick={() => handleDelete(user.id, false)}
          disabled={user.id === currentUser?.id}
          title="Eliminar"
        >
          <Icons.Trash /> Eliminar
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const totalPages = Math.ceil(clientTotal / LIMIT);

  return (
    <div className="usuarios-page">
      <header className="page-header usuarios-header">
        <div className="usuarios-hero">
           <div>
              <h1 className="page-title">Usuarios</h1>
              <p className="page-subtitle">Gestión de accesos y clientes</p>
           </div>
           <button className="btn btn-primary usuarios-add-btn" onClick={() => setShowCreateModal(true)}>
              <Icons.Plus /> <span className="hidden-mobile">Nuevo</span>
           </button>
        </div>
      </header>

      {/* ADMIN SECTION */}
       {admins.length > 0 && (
          <section className="usuarios-section usuarios-section--admin">
            <div className="usuarios-section-header">
              <h2 className="usuarios-section-title">🛡️ Administradores</h2>
              <span className="usuarios-section-pill">Equipo interno</span>
            </div>
            <div className="usuarios-table">
              <div className="usuarios-row usuarios-row-head">
                <div className="usuarios-cell usuarios-cell-main">Administrador</div>
                <div className="usuarios-cell">Rol</div>
                <div className="usuarios-cell">Estado</div>
                <div className="usuarios-cell usuarios-cell-actions">Acciones</div>
              </div>
              {admins.map(u => <AdminRow key={u.id} user={u} />)}
            </div>
          </section>
      )}

      {/* CLIENTS SECTION */}
      <section className="usuarios-section usuarios-section--clients">
        <div className="usuarios-section-header">
          <div>
            <h2 className="usuarios-section-title">🥑 Clientes</h2>
            <p className="usuarios-section-sub">Gestiona objetivos, planificador de platos y perfiles.</p>
          </div>
        </div>
        <div className="usuarios-search usuarios-search-wide">
          <input 
            type="text" 
            placeholder="Buscar cliente..." 
            className="form-input usuarios-search-input" 
            value={clientSearch}
            onChange={handleSearchChange}
          />
          <div className="usuarios-search-icon">
            <Icons.Search />
          </div>
        </div>

        <div className="usuarios-list">
             {loadingClients && (
                <div className="usuarios-loading">
                  <div className="spinner"></div>
                </div>
              )}
              
              {clientes.length === 0 ? (
                  <div className="text-center p-8 text-muted bg-light rounded">No se encontraron clientes.</div>
              ) : (
                  <div className="usuarios-table">
                    <div className="usuarios-row usuarios-row-head">
                      <div className="usuarios-cell usuarios-cell-main">Cliente</div>
                      <div className="usuarios-cell">Objetivo</div>
                      <div className="usuarios-cell">Estado</div>
                      <div className="usuarios-cell usuarios-cell-actions">Acciones</div>
                    </div>
                    {clientes.map(u => <ClientRow key={u.id} user={u} />)}
                  </div>
              )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="usuarios-pagination">
                  <button 
                    className="btn btn-outline btn-sm"
                    disabled={clientPage === 1}
                    onClick={() => setClientPage(p => p - 1)}
                  >
                    Anterior
                  </button>
                  <span className="text-muted text-sm">
                    {clientPage} / {totalPages}
                  </span>
                  <button 
                    className="btn btn-outline btn-sm"
                    disabled={clientPage >= totalPages}
                    onClick={() => setClientPage(p => p + 1)}
                  >
                    Siguiente
                  </button>
                </div>
            )}
        </div>
      </section>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nuevo Usuario</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            {error && (
              <div style={{ padding: '0 24px', color: 'var(--accent-danger)' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Email (con dominio @nutriorxata.com)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                  <label>Rol</label>
                  <select 
                    className="form-select"
                    value={formData.rol}
                    onChange={e => setFormData({...formData, rol: e.target.value})}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROFILE AND GOALS MODALS */}
      {showProfileModal && selectedUser && (
        <UserProfileModal 
            user={selectedUser} 
            onClose={() => setShowProfileModal(false)}
            onSave={() => loadClients()} 
        />
      )}

      {showGoalsModal && selectedUser && (
        <UserGoalsModal 
            user={selectedUser} 
            onClose={() => setShowGoalsModal(false)}
            onSave={() => loadClients()}
        />
      )}

      {showPlatosModal && selectedUser && (
        <UserPlatosModal 
            user={selectedUser} 
            onClose={() => setShowPlatosModal(false)}
            onSave={() => loadClients()}
        />
      )}
    </div>
  );
}

export default Usuarios;
