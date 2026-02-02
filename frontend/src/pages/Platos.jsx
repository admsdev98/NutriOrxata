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

function normalizeText(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getSearchTokens(value) {
  return normalizeText(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function matchesTokens(text, tokens) {
  if (!tokens.length) return true;
  const normalized = normalizeText(text);
  return tokens.every(token => normalized.includes(token));
}

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

function getPlatoMomentos(plato) {
  if (!plato) return [];
  if (Array.isArray(plato.momentos_dia) && plato.momentos_dia.length > 0) {
    return plato.momentos_dia;
  }
  if (plato.momento_dia) return [plato.momento_dia];
  return [];
}

function PlatoModal({ plato, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: plato?.nombre || '',
    descripcion: plato?.descripcion || '',
    momentos_dia: plato?.momentos_dia?.length
      ? plato.momentos_dia
      : (plato?.momento_dia ? [plato.momento_dia] : ['comida']),
  });
  const [ingredientesPlato, setIngredientesPlato] = useState([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [searchIng, setSearchIng] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ings] = await Promise.all([
        api.ingredientes.list(),
      ]);
      setIngredientesDisponibles(ings);

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

  function toggleMomento(momento) {
    setForm(prev => {
      const exists = prev.momentos_dia.includes(momento);
      const next = exists
        ? prev.momentos_dia.filter(m => m !== momento)
        : [...prev.momentos_dia, momento];
      return { ...prev, momentos_dia: next };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.momentos_dia.length) {
      alert('Selecciona al menos un momento del dia');
      return;
    }
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
  const ingredientTokens = getSearchTokens(searchIng);
  const filteredIngs = ingredientesDisponibles.filter(i => {
    if (!ingredientTokens.length) return false;
    if (ingredientesPlato.find(ip => ip.id === i.id)) return false;
    return matchesTokens(i.nombre, ingredientTokens);
  }).slice(0, 8);

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
                <label className="form-label">Momentos del dia</label>
                <div className="checkbox-group">
                  {MOMENTOS.map(m => (
                    <label key={m} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={form.momentos_dia.includes(m)}
                        onChange={() => toggleMomento(m)}
                      />
                      {MOMENTOS_DISPLAY[m].icon} {MOMENTOS_DISPLAY[m].label}
                    </label>
                  ))}
                </div>
                <p className="text-muted text-sm" style={{ marginTop: '6px' }}>
                  Puedes marcar mas de un momento si el plato encaja en varios.
                </p>
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
  const momentos = getPlatoMomentos(plato);
  
  return (
    <div className="card plato-card">
      <div className="plato-card-header">
        <div className="plato-card-main">
          <h3 className="plato-card-title">{plato.nombre}</h3>
          <div className="plato-card-meta">
            {momentos.map(momento => {
              const momentoInfo = MOMENTOS_DISPLAY[momento] || { icon: '🍽️', label: momento };
              return (
                <span key={momento} className="badge badge-primary">
                  {momentoInfo.icon} {momentoInfo.label}
                </span>
              );
            })}
            {plato.descripcion && (
              <span className="plato-card-desc">{plato.descripcion}</span>
            )}
          </div>
        </div>
        <div className="plato-card-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(plato)}>
            Editar
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(plato.id)}>
            ✕
          </button>
        </div>
      </div>
      <div className="nutrition-stats plato-nutrition">
        <div className="stat-item">
          <div className="stat-value">
            {Math.round(plato.calorias_totales)}
          </div>
          <div className="stat-label">kcal</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {Math.round(plato.proteinas_totales)}g
          </div>
          <div className="stat-label">prot</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {Math.round(plato.carbohidratos_totales)}g
          </div>
          <div className="stat-label">carb</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMomento, setActiveMomento] = useState('todos');

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
    acc[momento] = platos.filter(p => getPlatoMomentos(p).includes(momento));
    return acc;
  }, {});

  const searchTokens = getSearchTokens(searchQuery);
  const filteredPlatos = platos.filter(p => {
    const matchesMomento = activeMomento === 'todos' || getPlatoMomentos(p).includes(activeMomento);
    if (!matchesMomento) return false;
    if (!searchTokens.length) return true;
    const combined = `${p.nombre || ''} ${p.descripcion || ''}`;
    return matchesTokens(combined, searchTokens);
  });

  const momentCounts = MOMENTOS.reduce((acc, momento) => {
    acc[momento] = platosAgrupados[momento].length;
    return acc;
  }, {});

  const activeMomentoInfo = MOMENTOS_DISPLAY[activeMomento];
  const showGrouped = activeMomento === 'todos' && searchTokens.length === 0;
  const momentosConPlatos = MOMENTOS.filter(m => platosAgrupados[m].length > 0).length;
  const averageKcal = platos.length > 0
    ? Math.round(platos.reduce((sum, p) => sum + (p.calorias_totales || 0), 0) / platos.length)
    : 0;

  return (
    <div className="platos-page">
      <header className="platos-hero">
        <div className="platos-hero-main">
          <p className="platos-eyebrow">Gestor de platos</p>
          <h1 className="page-title">🍽️ Platos</h1>
          <p className="page-subtitle">
            Crea, organiza y reutiliza platos con ingredientes y nutricion automatica.
          </p>
        </div>
        <div className="platos-hero-actions">
          <button className="btn btn-primary" onClick={handleNew}>
            + Crear plato
          </button>
        </div>
        <div className="platos-hero-stats">
          <div className="platos-stat">
            <span className="platos-stat-value">{platos.length}</span>
            <span className="platos-stat-label">platos totales</span>
          </div>
          <div className="platos-stat">
            <span className="platos-stat-value">{momentosConPlatos}</span>
            <span className="platos-stat-label">momentos con platos</span>
          </div>
          <div className="platos-stat">
            <span className="platos-stat-value">{averageKcal}</span>
            <span className="platos-stat-label">kcal promedio</span>
          </div>
        </div>
      </header>

      <section className="platos-toolbar card">
        <div className="platos-search">
          <span className="platos-search-icon">🔍</span>
          <input
            type="text"
            className="form-input platos-search-input"
            placeholder="Buscar por nombre o descripcion..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="platos-filters">
          <button
            className={`platos-filter-btn ${activeMomento === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveMomento('todos')}
          >
            Todos
            <span className="platos-filter-count">{platos.length}</span>
          </button>
          {MOMENTOS.map(m => (
            <button
              key={m}
              className={`platos-filter-btn ${activeMomento === m ? 'active' : ''}`}
              onClick={() => setActiveMomento(m)}
            >
              {MOMENTOS_DISPLAY[m].icon} {MOMENTOS_DISPLAY[m].label}
              <span className="platos-filter-count">{momentCounts[m]}</span>
            </button>
          ))}
        </div>
        {(activeMomento !== 'todos' || searchTokens.length > 0) && (
          <div className="platos-toolbar-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setActiveMomento('todos'); setSearchQuery(''); }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : platos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <h3 className="empty-state-title">No hay platos</h3>
          <p>Crea tu primer plato para empezar</p>
          <button className="btn btn-primary" onClick={handleNew} style={{ marginTop: '16px' }}>
            + Crear plato
          </button>
        </div>
      ) : (
        <div className="platos-sections">
          {showGrouped ? (
            MOMENTOS.map(momento => {
              const platosDelMomento = platosAgrupados[momento];
              if (platosDelMomento.length === 0) return null;

              const momentoInfo = MOMENTOS_DISPLAY[momento];

              return (
                <section key={momento} className="platos-section">
                  <div className="platos-section-header">
                    <div>
                      <h2 className="platos-section-title">
                        <span className="platos-section-icon">{momentoInfo.icon}</span>
                        {momentoInfo.label}
                      </h2>
                      <p className="platos-section-sub">
                        {platosDelMomento.length} {platosDelMomento.length === 1 ? 'plato' : 'platos'} disponibles
                      </p>
                    </div>
                    <span className="platos-section-pill">
                      {momentoInfo.icon} {momentoInfo.label}
                    </span>
                  </div>
                  <div className="platos-grid">
                    {platosDelMomento.map(plato => (
                      <PlatoCard
                        key={plato.id}
                        plato={plato}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <section className="platos-section">
              <div className="platos-section-header">
                <div>
                  <h2 className="platos-section-title">Resultados</h2>
                  <p className="platos-section-sub">
                    {filteredPlatos.length} {filteredPlatos.length === 1 ? 'plato' : 'platos'} encontrados
                  </p>
                </div>
                {activeMomentoInfo && (
                  <span className="platos-section-pill">
                    {activeMomentoInfo.icon} {activeMomentoInfo.label}
                  </span>
                )}
              </div>
              {filteredPlatos.length === 0 ? (
                <div className="empty-state compact">
                  <p className="text-muted">No hay resultados con esos filtros.</p>
                </div>
              ) : (
                <div className="platos-grid">
                  {filteredPlatos.map(plato => (
                    <PlatoCard
                      key={plato.id}
                      plato={plato}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
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
