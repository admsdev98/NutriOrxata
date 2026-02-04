import { useState, useEffect } from 'react';
import api from '../api/client';
import UserProfileModal from '../components/UserProfileModal';
import UserGoalsModal from '../components/UserGoalsModal';
import UserPlatosModal from '../components/UserPlatosModal';

function Usuarios() {
  // State
  const [admins, setAdmins] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clientPage, setClientPage] = useState(1);
  const [clientTotal, setClientTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'profile' | 'goals' | 'platos'

  const currentUser = api.auth.getUser();

  useEffect(() => {
    loadData();
  }, [clientPage, search]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [adminsData, clientsData] = await Promise.all([
            api.auth.listUsers({ rol: 'admin' }),
            api.auth.listUsers({ rol: 'cliente', skip: (clientPage - 1) * 10, limit: 10, search })
        ]);
        setAdmins(adminsData.items || []);
        setClientes(clientsData.items || []);
        setClientTotal(clientsData.total || 0);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
          nombre: form.nombre.value,
          email: form.email.value,
          password: form.password.value,
          rol: form.rol.value
      };
      
      try {
          await api.auth.register(data);
          setShowCreateModal(false);
          loadData();
      } catch (err) {
          alert(err.message);
      }
  };

  const handleDelete = async (id) => {
      if(!confirm('¿Eliminar usuario irreversiblemente?')) return;
      try {
          await api.auth.deleteUser(id);
          loadData();
      } catch(e) { alert(e.message); }
  };

  const toggleActive = async (u) => {
      try {
          await api.auth.updateUser(u.id, { activo: !u.activo });
          loadData();
      } catch(e) { alert(e.message); }
  };

  const UserTableRow = ({ u, isAdmin }) => {
      const isSelected = selectedUser?.id === u.id;
      return (
          <div 
            onClick={() => setSelectedUser(u)}
            className={`flex items-center gap-4 p-4 border-b border-border hover:bg-hover transition-colors cursor-pointer group ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary' : ''}`}
          >
              <div 
                 className="shrink-0 flex items-center justify-center font-bold text-lg"
                 style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-100)', color: 'var(--primary-600)' }}
              >
                  {u.nombre?.[0] || '?'}
              </div>
              
              <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{u.nombre} {u.apellidos}</div>
                  <div className="text-secondary text-xs truncate">{u.email}</div>
              </div>

              {!isAdmin && (
                <div className="hidden md:block w-32">
                    <span className="badge badge-primary">{u.objetivo || 'No definido'}</span>
                </div>
              )}

              <div className="hidden md:block w-24">
                  <span className={`badge ${u.activo ? 'badge-success' : 'badge-error'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
              </div>

              {/* Action Buttons for Clients */}
              {!isAdmin && (
                  <div className="flex gap-2">
                       <a
                         className="btn btn-sm btn-outline" 
                         href={`/clientes/${u.id}`}
                         onClick={(e) => e.stopPropagation()}
                       >
                         Ir al perfil de {u.nombre}
                       </a>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="page-title">Usuarios</h1>
                <p className="page-subtitle">Gestión de clientes y administradores</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Nuevo Usuario</button>
        </div>

        <div className="flex flex-col gap-6">
            <div className="flex-1 min-w-0 flex flex-col gap-8">
                
                {/* SEARCH */}
                <div className="relative">
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Buscar por nombre o email..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* ADMINS / TRABAJADORES SECTION */}
                <div className="card p-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-main uppercase text-sm tracking-wider">Admin / Trabajadores</h3>
                        <span className="badge badge-secondary">{admins.length}</span>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                             <div className="p-4 text-center text-secondary text-sm">Cargando...</div>
                        ) : admins.length > 0 ? (
                            admins.map(a => <UserTableRow key={a.id} u={a} isAdmin={true} />)
                        ) : (
                            <div className="p-4 text-center text-secondary text-sm">No hay trabajadores</div>
                        )}
                    </div>
                </div>

                {/* CLIENTES SECTION */}
                <div className="card p-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-gray-50 flex justify-between items-center">
                         <h3 className="font-bold text-main uppercase text-sm tracking-wider">Clientes</h3>
                         <span className="badge badge-secondary">{clientTotal}</span>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                             <div className="p-8 text-center"><div className="spinner" /></div>
                        ) : clientes.length > 0 ? (
                            clientes.map(c => <UserTableRow key={c.id} u={c} isAdmin={false} />)
                        ) : (
                            <div className="p-8 text-center text-secondary">No hay clientes registrados</div>
                        )}
                    </div>
                    
                    {/* Pagination */}
                    {clientTotal > 10 && (
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-border">
                            <button disabled={clientPage === 1} onClick={() => setClientPage(p => p - 1)} className="btn btn-secondary btn-sm">Anterior</button>
                            <span className="text-xs font-medium text-secondary">Página {clientPage}</span>
                            <button disabled={clientes.length < 10} onClick={() => setClientPage(p => p + 1)} className="btn btn-secondary btn-sm">Siguiente</button>
                        </div>
                    )}
                </div>
            </div>


        </div>

        {/* CREATE USER MODAL */}
        {showCreateModal && (
            <div className="modal-overlay">
                <div className="modal">
                    <div className="modal-header">
                        <h2 className="modal-title">Nuevo Usuario</h2>
                        <button className="btn-icon" onClick={() => setShowCreateModal(false)}>X</button>
                    </div>
                    <form onSubmit={handleCreate} className="modal-body space-y-4">
                        <div className="form-group">
                            <label className="form-label">Nombre</label>
                            <input name="nombre" className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input name="email" type="email" className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contraseña</label>
                            <input name="password" type="password" className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Rol</label>
                            <select name="rol" className="form-select">
                                <option value="cliente">Cliente</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <button className="btn btn-primary w-full mt-4">Crear Usuario</button>
                    </form>
                </div>
            </div>
        )}

        {/* SUB MODALS */}
        {modalType === 'profile' && selectedUser && (
            <UserProfileModal user={selectedUser} onClose={() => setModalType(null)} onSave={loadData} />
        )}
        {modalType === 'goals' && selectedUser && (
            <UserGoalsModal user={selectedUser} onClose={() => setModalType(null)} onSave={loadData} />
        )}
        {modalType === 'platos' && selectedUser && (
            <UserPlatosModal user={selectedUser} onClose={() => setModalType(null)} onSave={loadData} />
        )}
    </div>
  );
}

export default Usuarios;
