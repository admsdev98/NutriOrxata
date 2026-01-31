import { useState, useEffect } from 'react';
import api from '../api/client';

function FamiliarModal({ familiar, onClose, onSave }) {
  const [form, setForm] = useState(familiar || {
    nombre: '',
    edad: '',
    peso: '',
    altura: '',
    genero: 'M',
    actividad_fisica: 'moderado',
    objetivo_calorias: 2000,
    notas: '',
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  
  // Calculadora state
  const [calculando, setCalculando] = useState(false);
  const [objetivosSugeridos, setObjetivosSugeridos] = useState(null);

  useEffect(() => {
    // Si hay datos para calcular, mostramos sugerencias?
    // Mejor hacerlo on-demand o cuando cambian los inputs relevantes
    if (form.peso && form.altura && form.edad) {
      calcularObjetivos();
    }
  }, [form.peso, form.altura, form.edad, form.genero, form.actividad_fisica]);

  async function calcularObjetivos() {
    try {
      setCalculando(true);
      const data = await api.familiares.calcularObjetivos({
        peso: form.peso,
        altura: form.altura,
        edad: form.edad,
        genero: form.genero,
        actividad: form.actividad_fisica
      });
      setObjetivosSugeridos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCalculando(false);
    }
  }

  function aplicarObjetivo(valor) {
    setForm(prev => ({ ...prev, objetivo_calorias: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        edad: form.edad ? parseInt(form.edad) : null,
        peso: form.peso ? parseFloat(form.peso) : null,
        altura: form.altura ? parseInt(form.altura) : null,
        objetivo_calorias: parseInt(form.objetivo_calorias) || 2000,
      };

      if (familiar?.id) {
        await api.familiares.update(familiar.id, data);
      } else {
        await api.familiares.create(data);
      }
      onSave();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {familiar?.id ? '✏️ Editar Perfil' : '👤 Nuevo Perfil'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Columna Izquierda: Datos */}
            <div>
              <h3 className="text-secondary mb-3">Datos Personales</h3>
              
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Edad</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.edad}
                    onChange={e => setForm({ ...form, edad: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Género</label>
                  <select 
                    className="form-select"
                    value={form.genero}
                    onChange={e => setForm({ ...form, genero: e.target.value })}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={form.peso}
                    onChange={e => setForm({ ...form, peso: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Altura (cm)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.altura}
                    onChange={e => setForm({ ...form, altura: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nivel de Actividad</label>
                <select 
                  className="form-select"
                  value={form.actividad_fisica}
                  onChange={e => setForm({ ...form, actividad_fisica: e.target.value })}
                >
                  <option value="sedentario">Sedentario (Oficina, poco ejercicio)</option>
                  <option value="ligero">Ligero (1-3 días/semana)</option>
                  <option value="moderado">Moderado (3-5 días/semana)</option>
                  <option value="activo">Activo (6-7 días/semana)</option>
                  <option value="muy_activo">Muy Activo (Trabajo físico intenso)</option>
                </select>
              </div>
            </div>

            {/* Columna Derecha: Objetivos y Calculadora */}
            <div>
              <h3 className="text-secondary mb-3">Objetivos Nutricionales</h3>
              
              <div className="form-group">
                <label className="form-label">Objetivo de calorías diario</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                  value={form.objetivo_calorias}
                  onChange={e => setForm({ ...form, objetivo_calorias: e.target.value })}
                />
              </div>

              {objetivosSugeridos && (
                <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                  <h4 className="mb-2">📊 Sugerencias calculadas</h4>
                  <p className="text-muted text-sm mb-3">
                    Basado en TDEE: <strong>{objetivosSugeridos.tdee} kcal</strong>
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm flex flex-between"
                      onClick={() => aplicarObjetivo(objetivosSugeridos.deficit)}
                    >
                      <span>📉 Déficit (Perder Grasa)</span>
                      <strong>{objetivosSugeridos.deficit} kcal</strong>
                    </button>
                    
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm flex flex-between"
                      onClick={() => aplicarObjetivo(objetivosSugeridos.mantenimiento)}
                    >
                      <span>⚖️ Mantenimiento</span>
                      <strong>{objetivosSugeridos.mantenimiento} kcal</strong>
                    </button>
                    
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm flex flex-between"
                      onClick={() => aplicarObjetivo(objetivosSugeridos.volumen)}
                    >
                      <span>💪 Volumen (Ganar Músculo)</span>
                      <strong>{objetivosSugeridos.volumen} kcal</strong>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Notas footer completo */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="form-group">
                <label className="form-label">Notas adicionales</label>
                <textarea
                  className="form-textarea"
                  value={form.notas || ''}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Alergias, preferencias, condiciones médicas..."
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={e => setForm({ ...form, activo: e.target.checked })}
                  />
                  Perfil Activo (Visible en planificador)
                </label>
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Familiares() {
  const [familiares, setFamiliares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadFamiliares();
  }, []);

  async function loadFamiliares() {
    try {
      const data = await api.familiares.list();
      setFamiliares(data);
    } catch (error) {
      console.error('Error loading familiares:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function handleEdit(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este familiar?')) return;
    try {
      await api.familiares.delete(id);
      loadFamiliares();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingItem(null);
  }

  function handleSave() {
    handleModalClose();
    loadFamiliares();
  }

  return (
    <div>
      <header className="page-header">
        <div className="flex flex-between flex-center">
          <div>
            <h1 className="page-title">👨‍👩‍👧‍👦 Familiares</h1>
            <p className="page-subtitle">Gestiona los perfiles y objetivos nutricionales de la familia</p>
          </div>
          <button className="btn btn-primary" onClick={handleNew}>
            + Nuevo Perfil
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : familiares.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👨‍👩‍👧‍👦</div>
          <h3 className="empty-state-title">No hay familiares</h3>
          <p>Crea el primer perfil para empezar a planificar</p>
          <button className="btn btn-primary mt-2" onClick={handleNew}>
            Crear Perfil
          </button>
        </div>
      ) : (
        <div className="grid grid-3">
          {familiares.map(f => (
            <div key={f.id} className="card">
              <div className="flex flex-between flex-center" style={{ marginBottom: '16px' }}>
                <div className="avatar-placeholder" style={{ 
                  width: '48px', height: '48px', fontSize: '1.5rem',
                  background: 'var(--bg-secondary)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {f.genero === 'F' ? '👩' : '👨'}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(f)}>
                    Editar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>
                    ✕
                  </button>
                </div>
              </div>
              
              <h3 style={{ marginBottom: '4px' }}>
                {f.nombre}
                {!f.activo && <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>Inactivo</span>}
              </h3>
              
              <div className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                {f.edad ? `${f.edad} años` : ''} 
                {f.peso ? ` • ${f.peso}kg` : ''}
                {f.altura ? ` • ${f.altura}cm` : ''}
              </div>

              <div className="nutrition-stats" style={{ gridTemplateColumns: '1fr', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div className="stat-item">
                  <div className="stat-value text-primary">{f.objetivo_calorias}</div>
                  <div className="stat-label">kcal/día objetivo</div>
                </div>
              </div>
              
              {f.actividad_fisica && (
                <div className="text-center mt-2 text-muted" style={{ fontSize: '0.8rem' }}>
                  Actividad: {f.actividad_fisica.replace(/_/g, ' ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <FamiliarModal
          familiar={editingItem}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Familiares;
