import { useState, useEffect } from 'react';
import api from '../api/client';

const MOMENTOS = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
const MOMENTOS_DISPLAY = {
  desayuno: { icon: '🌅', label: 'Desayuno' },
  almuerzo: { icon: '🥪', label: 'Almuerzo' },
  comida: { icon: '☀️', label: 'Comida' },
  merienda: { icon: '🍎', label: 'Merienda' },
  cena: { icon: '🌙', label: 'Cena' },
};

function calcularNutricion(ingredientes) {
  return ingredientes.reduce((total, ing) => {
    const factor = ing.cantidad_gramos / 100;
    return {
      calorias: total.calorias + (ing.calorias_por_100g || 0) * factor,
      proteinas: total.proteinas + (ing.proteinas_por_100g || 0) * factor,
      carbohidratos: total.carbohidratos + (ing.carbohidratos_por_100g || 0) * factor,
      grasas: total.grasas + (ing.grasas_por_100g || 0) * factor,
      peso: total.peso + ing.cantidad_gramos,
    };
  }, { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, peso: 0 });
}

function PlatoModal({ plato, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: plato?.nombre || '',
    descripcion: plato?.descripcion || '',
    momento_dia: plato?.momento_dia || 'comida',
  });
  const [ingredientesPlato, setIngredientesPlato] = useState([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [familiares, setFamiliares] = useState([]);
  const [familiaresSeleccionados, setFamiliaresSeleccionados] = useState([]);
  const [searchIng, setSearchIng] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ings, fams] = await Promise.all([
        api.ingredientes.list(),
        api.familiares.list(),
      ]);
      setIngredientesDisponibles(ings);
      setFamiliares(fams);

      if (plato?.id) {
        const platoDetail = await api.platos.get(plato.id);
        setIngredientesPlato(platoDetail.ingredientes.map(pi => ({
          id: pi.ingrediente_id,
          nombre: pi.ingrediente_nombre,
          cantidad_gramos: pi.cantidad_gramos,
          calorias_por_100g: (pi.calorias_aportadas / pi.cantidad_gramos) * 100,
          proteinas_por_100g: (pi.proteinas_aportadas / pi.cantidad_gramos) * 100,
          carbohidratos_por_100g: (pi.carbohidratos_aportados / pi.cantidad_gramos) * 100,
          grasas_por_100g: (pi.grasas_aportadas / pi.cantidad_gramos) * 100,
        })));
        setFamiliaresSeleccionados(platoDetail.familiares.map(f => f.id));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  function addIngrediente(ing) {
    if (ingredientesPlato.find(i => i.id === ing.id)) return;
    setIngredientesPlato([...ingredientesPlato, {
      id: ing.id,
      nombre: ing.nombre,
      cantidad_gramos: 100,
      calorias_por_100g: ing.calorias_por_100g,
      proteinas_por_100g: ing.proteinas_por_100g,
      carbohidratos_por_100g: ing.carbohidratos_por_100g,
      grasas_por_100g: ing.grasas_por_100g,
    }]);
    setSearchIng('');
  }

  function updateCantidad(idx, cantidad) {
    const updated = [...ingredientesPlato];
    updated[idx].cantidad_gramos = parseFloat(cantidad) || 0;
    setIngredientesPlato(updated);
  }

  function removeIngrediente(idx) {
    setIngredientesPlato(ingredientesPlato.filter((_, i) => i !== idx));
  }

  function toggleFamiliar(id) {
    if (familiaresSeleccionados.includes(id)) {
      setFamiliaresSeleccionados(familiaresSeleccionados.filter(f => f !== id));
    } else {
      setFamiliaresSeleccionados([...familiaresSeleccionados, id]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (ingredientesPlato.length === 0) {
      alert('Añade al menos un ingrediente');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...form,
        ingredientes: ingredientesPlato.map(i => ({
          ingrediente_id: i.id,
          cantidad_gramos: i.cantidad_gramos,
        })),
        familiares_ids: familiaresSeleccionados,
      };

      if (plato?.id) {
        await api.platos.update(plato.id, form);
      } else {
        await api.platos.create(data);
      }
      onSave();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  const nutricion = calcularNutricion(ingredientesPlato);
  const filteredIngs = ingredientesDisponibles.filter(
    i => i.nombre.toLowerCase().includes(searchIng.toLowerCase()) &&
         !ingredientesPlato.find(ip => ip.id === i.id)
  ).slice(0, 8);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {plato?.id ? '✏️ Editar Plato' : '🍽️ Crear Nuevo Plato'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre del plato</label>
              <input
                type="text"
                className="form-input"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Macarrones a la Boloñesa"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Breve descripción..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Etiqueta (momento del día)</label>
                <div className="radio-group">
                  {MOMENTOS.map(m => (
                    <label key={m} className="radio-item">
                      <input
                        type="radio"
                        name="momento"
                        checked={form.momento_dia === m}
                        onChange={() => setForm({ ...form, momento_dia: m })}
                      />
                      {MOMENTOS_DISPLAY[m].icon} {MOMENTOS_DISPLAY[m].label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Asignar a familiares</label>
              <div className="checkbox-group">
                {familiares.map(f => (
                  <label key={f.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={familiaresSeleccionados.includes(f.id)}
                      onChange={() => toggleFamiliar(f.id)}
                    />
                    {f.nombre}
                  </label>
                ))}
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />

            <h4 style={{ marginBottom: '16px' }}>📦 Ingredientes</h4>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Buscar ingrediente para añadir..."
                value={searchIng}
                onChange={e => setSearchIng(e.target.value)}
              />
              {searchIng && filteredIngs.length > 0 && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  marginTop: '8px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}>
                  {filteredIngs.map(ing => (
                    <div
                      key={ing.id}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                      onClick={() => addIngrediente(ing)}
                    >
                      <strong>{ing.nombre}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.9rem' }}>
                        {Math.round(ing.calorias_por_100g)} kcal/100g
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {ingredientesPlato.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <p className="text-muted">Busca y añade ingredientes al plato</p>
              </div>
            ) : (
              <div>
                {ingredientesPlato.map((ing, idx) => {
                  const factor = ing.cantidad_gramos / 100;
                  const kcal = (ing.calorias_por_100g * factor).toFixed(0);
                  const prot = (ing.proteinas_por_100g * factor).toFixed(1);
                  const carb = (ing.carbohidratos_por_100g * factor).toFixed(1);
                  const grasas = (ing.grasas_por_100g * factor).toFixed(1);

                  return (
                    <div key={ing.id} className="ingredient-item">
                      <div className="ingredient-info">
                        <div className="ingredient-name">{idx + 1}. {ing.nombre}</div>
                        <div className="ingredient-nutrition">
                          Por 100g: {Math.round(ing.calorias_por_100g)} kcal
                        </div>
                      </div>
                      <div className="ingredient-quantity">
                        <input
                          type="number"
                          className="form-input quantity-input"
                          value={ing.cantidad_gramos}
                          onChange={e => updateCantidad(idx, e.target.value)}
                          min="1"
                        />
                        <span>g</span>
                      </div>
                      <div className="ingredient-contribution">
                        ➜ {kcal} kcal | {prot}g prot | {carb}g carb | {grasas}g grasas
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeIngrediente(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {ingredientesPlato.length > 0 && (
              <div className="nutrition-stats" style={{ marginTop: '24px' }}>
                <div className="stat-item">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-value">{nutricion.calorias.toFixed(0)}</div>
                  <div className="stat-label">kcal totales</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🥩</div>
                  <div className="stat-value">{nutricion.proteinas.toFixed(1)}g</div>
                  <div className="stat-label">proteínas</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🍞</div>
                  <div className="stat-value">{nutricion.carbohidratos.toFixed(1)}g</div>
                  <div className="stat-label">carbohidratos</div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">🥑</div>
                  <div className="stat-value">{nutricion.grasas.toFixed(1)}g</div>
                  <div className="stat-label">grasas</div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <span style={{ flex: 1, color: 'var(--text-muted)' }}>
              ⚖️ Peso total: {nutricion.peso.toFixed(0)}g
            </span>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar plato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlatoCard({ plato, onEdit, onDelete }) {
  const momento = MOMENTOS_DISPLAY[plato.momento_dia] || { icon: '🍽️', label: plato.momento_dia };
  
  return (
    <div className="card plato-card">
      <div className="flex flex-between flex-center" style={{ marginBottom: '12px' }}>
        <div>
          <h3 style={{ marginBottom: '4px' }}>{plato.nombre}</h3>
          <span className="badge badge-primary">
            {momento.icon} {momento.label}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(plato)}>
            Editar
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(plato.id)}>
            ✕
          </button>
        </div>
      </div>
      {plato.descripcion && (
        <p className="text-muted" style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
          {plato.descripcion}
        </p>
      )}
      <div className="nutrition-stats" style={{ padding: '16px', fontSize: '0.9rem' }}>
        <div className="stat-item">
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>
            {Math.round(plato.calorias_totales)}
          </div>
          <div className="stat-label">kcal</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>
            {Math.round(plato.proteinas_totales)}g
          </div>
          <div className="stat-label">prot</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>
            {Math.round(plato.carbohidratos_totales)}g
          </div>
          <div className="stat-label">carb</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>
            {Math.round(plato.grasas_totales)}g
          </div>
          <div className="stat-label">grasas</div>
        </div>
      </div>
    </div>
  );
}

function Platos() {
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPlatos();
  }, []);

  async function loadPlatos() {
    try {
      const data = await api.platos.list();
      setPlatos(data);
    } catch (error) {
      console.error('Error loading platos:', error);
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
    setSearchOpen(false);
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este plato?')) return;
    try {
      await api.platos.delete(id);
      loadPlatos();
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
    loadPlatos();
  }

  const platosAgrupados = MOMENTOS.reduce((acc, momento) => {
    acc[momento] = platos.filter(p => p.momento_dia === momento);
    return acc;
  }, {});

  const searchResults = searchQuery
    ? platos.filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div>
      <header className="page-header">
        <div className="flex flex-between flex-center">
          <div>
            <h1 className="page-title">🍽️ Platos</h1>
            <p className="page-subtitle">Crea platos con ingredientes y nutrición automática</p>
          </div>
          <div className="flex gap-2">
            <button 
              className={`btn ${searchOpen ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              🔍 Buscar
            </button>
            <button className="btn btn-primary" onClick={handleNew}>
              + Crear plato
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="flex gap-2 flex-center">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar cualquier plato por nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
              ✕ Cerrar
            </button>
          </div>
          
          {searchQuery && (
            <div style={{ marginTop: '16px' }}>
              {searchResults.length === 0 ? (
                <p className="text-muted">No se encontraron platos con "{searchQuery}"</p>
              ) : (
                <div className="grid grid-2">
                  {searchResults.map(plato => (
                    <PlatoCard 
                      key={plato.id} 
                      plato={plato} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : platos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <h3 className="empty-state-title">No hay platos</h3>
          <p>Crea tu primer plato para empezar</p>
        </div>
      ) : (
        <div>
          {MOMENTOS.map(momento => {
            const platosDelMomento = platosAgrupados[momento];
            if (platosDelMomento.length === 0) return null;
            
            const momentoInfo = MOMENTOS_DISPLAY[momento];
            
            return (
              <div key={momento} style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  marginBottom: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: 'var(--text-primary)'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{momentoInfo.icon}</span>
                  {momentoInfo.label}
                  <span style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--text-muted)', 
                    fontWeight: 'normal' 
                  }}>
                    ({platosDelMomento.length} {platosDelMomento.length === 1 ? 'plato' : 'platos'})
                  </span>
                </h2>
                <div className="grid grid-2">
                  {platosDelMomento.map(plato => (
                    <PlatoCard 
                      key={plato.id} 
                      plato={plato} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <PlatoModal
          plato={editingItem}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Platos;
