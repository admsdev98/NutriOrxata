
import { useState, useEffect } from 'react';
import api from '../api/client';

function UserProfileModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    edad: '',
    altura: '',
    peso: '',
    sexo: 'hombre'
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        edad: user.edad || '',
        altura: user.altura || '',
        peso: user.peso || '',
        sexo: user.sexo || 'hombre',
      });
    }
    setNewPassword('');
  }, [user]);

  function handleClose() {
    setNewPassword('');
    onClose();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        edad: formData.edad ? parseInt(formData.edad) : null,
        altura: formData.altura ? parseInt(formData.altura) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
      };

      const trimmedPassword = newPassword.trim();
      if (trimmedPassword) {
        payload.password = trimmedPassword;
      }
      
      await api.auth.updateUser(user.id, payload);
      onSave(); // Trigger reload in parent
      setNewPassword('');
      onClose();
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal profile-modal">
        <div className="modal-header">
          <h3>Editar Perfil: {user.nombre}</h3>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body profile-body">
          <section className="profile-section panel-card">
            <div className="section-title-row">
              <div>
                <h4 className="section-title">Datos basicos</h4>
                <p className="section-help">Informacion personal y contacto.</p>
              </div>
            </div>

            <div className="grid grid-2">
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
                <label>Apellidos</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.apellidos}
                  onChange={e => setFormData({...formData, apellidos: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Nueva contraseña (opcional)</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Dejar en blanco para no cambiar"
              />
            </div>
          </section>

          <section className="profile-section panel-card">
            <div className="section-title-row">
              <div>
                <h4 className="section-title">Datos fisicos</h4>
                <p className="section-help">Medidas para calcular objetivos.</p>
              </div>
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label>Edad</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.edad}
                  onChange={e => setFormData({...formData, edad: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Altura (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.altura}
                  onChange={e => setFormData({...formData, altura: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formData.peso}
                  onChange={e => setFormData({...formData, peso: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sexo</label>
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    name="sexo"
                    value="hombre"
                    checked={formData.sexo === 'hombre'}
                    onChange={e => setFormData({...formData, sexo: e.target.value})}
                  /> Hombre
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    name="sexo"
                    value="mujer"
                    checked={formData.sexo === 'mujer'}
                    onChange={e => setFormData({...formData, sexo: e.target.value})}
                  /> Mujer
                </label>
              </div>
            </div>
          </section>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserProfileModal;
