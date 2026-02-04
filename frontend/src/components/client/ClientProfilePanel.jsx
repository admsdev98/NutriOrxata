import { useState, useEffect } from 'react';
import api from '../../api/client';

function ClientProfilePanel({ user, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    edad: '',
    altura: '',
    peso: '',
    sexo: 'hombre',
    objetivo: 'mantenimiento',
    alergias: '',
    notas: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        objetivo: user.objetivo || 'mantenimiento',
        alergias: user.alergias || '',
        notas: user.notas || ''
      });
    }
    setNewPassword('');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      if (onSave) onSave();
      setNewPassword('');
      alert('Perfil actualizado correctamente');
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* BASIC INFO */}
      <section className="card p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Información personal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-input"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Apellidos</label>
            <input
              type="text"
              className="form-input"
              value={formData.apellidos}
              onChange={e => setFormData({...formData, apellidos: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cambiar Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Dejar en blanco para mantener"
            />
          </div>
        </div>
      </section>

      {/* PHYSICAL DATA */}
      <section className="card p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Datos físicos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Edad</label>
            <input
              type="number"
              className="form-input"
              value={formData.edad}
              onChange={e => setFormData({...formData, edad: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Altura (cm)</label>
            <input
              type="number"
              className="form-input"
              value={formData.altura}
              onChange={e => setFormData({...formData, altura: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={formData.peso}
              onChange={e => setFormData({...formData, peso: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sexo</label>
            <select 
                className="form-select"
                value={formData.sexo}
                onChange={e => setFormData({...formData, sexo: e.target.value})}
            >
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
            </select>
          </div>
        </div>
      </section>

      {/* EXTRA INFO */}
      <section className="card p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Información adicional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
                <label className="form-label">Objetivo Actual</label>
                <select 
                    className="form-select"
                    value={formData.objetivo}
                    onChange={e => setFormData({...formData, objetivo: e.target.value})}
                >
                    <option value="definicion">Definición</option>
                    <option value="volumen">Volumen</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="perdida_peso">Pérdida de Peso</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Alergias / Intolerancias</label>
                <input
                    type="text"
                    className="form-input"
                    value={formData.alergias}
                    onChange={e => setFormData({...formData, alergias: e.target.value})}
                    placeholder="Ej: Nueces, Lactosa..."
                />
            </div>
            <div className="form-group md:col-span-2">
                <label className="form-label">Notas Privadas / Observaciones</label>
                <textarea
                    className="form-input"
                    rows="3"
                    value={formData.notas}
                    onChange={e => setFormData({...formData, notas: e.target.value})}
                    placeholder="Anotaciones sobre el progreso, lesiones, etc."
                ></textarea>
            </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}

export default ClientProfilePanel;
