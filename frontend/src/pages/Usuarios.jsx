import { useState, useEffect } from 'react';
import api from '../api/client';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [familiares, setFamiliares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'usuario',
    familiar_id: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [users, fams] = await Promise.all([
        api.auth.listUsers(),
        api.familiares.list({ activo: true })
      ]);
      setUsuarios(users);
      setFamiliares(fams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    try {
      const payload = {
        ...formData,
        familiar_id: formData.familiar_id ? parseInt(formData.familiar_id) : null
      };
      
      await api.auth.register(payload);
      setShowModal(false);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'usuario',
        familiar_id: ''
      });
      loadData();
    } catch (err) {
      setError(err.message || 'Error al crear usuario');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Estás seguro de ELIMINAR este usuario?')) return;
    try {
      await api.auth.deleteUser(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">👥 Usuarios</h1>
          <p className="page-subtitle">Gestión de accesos y roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo Usuario
        </button>
      </header>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Familiar Vinculado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => {
              const familiar = familiares.find(f => f.id === u.familiar_id);
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.nombre}</div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.rol === 'admin' ? 'badge-primary' : ''}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td>
                    {familiar ? (
                      <div>👤 {familiar.nombre}</div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(u.id)}
                      disabled={u.rol === 'admin' && u.id === api.auth.getUser().id}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nuevo Usuario</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
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

              <div className="grid grid-2">
                <div className="form-group">
                  <label>Rol</label>
                  <select 
                    className="form-select"
                    value={formData.rol}
                    onChange={e => setFormData({...formData, rol: e.target.value})}
                  >
                    <option value="usuario">Usuario Familiar</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {formData.rol === 'usuario' && (
                  <div className="form-group">
                    <label>Vincular Familiar</label>
                    <select 
                      className="form-select"
                      value={formData.familiar_id}
                      onChange={e => setFormData({...formData, familiar_id: e.target.value})}
                      required
                    >
                      <option value="">Selecciona...</option>
                      {familiares.map(f => (
                        <option key={f.id} value={f.id}>{f.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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
    </div>
  );
}

export default Usuarios;
