import { useState, useEffect } from 'react';
import api from '../api/client';

const CATEGORIAS = [
  'Pasta y arroz', 'Carnes', 'Pescados', 'Verduras', 'Frutas',
  'Lácteos', 'Huevos', 'Legumbres', 'Pan', 'Cereales', 'Aceites', 'Salsas', 'Otros'
];

function IngredienteModal({ ingrediente, onClose, onSave }) {
  const [form, setForm] = useState(ingrediente || {
    nombre: '',
    categoria: 'Otros',
    supermercado: 'Mercadona',
    calorias_por_100g: '',
    proteinas_por_100g: '',
    carbohidratos_por_100g: '',
    grasas_por_100g: '',
    fibra_por_100g: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        calorias_por_100g: parseFloat(form.calorias_por_100g) || 0,
        proteinas_por_100g: parseFloat(form.proteinas_por_100g) || 0,
        carbohidratos_por_100g: parseFloat(form.carbohidratos_por_100g) || 0,
        grasas_por_100g: parseFloat(form.grasas_por_100g) || 0,
        fibra_por_100g: parseFloat(form.fibra_por_100g) || 0,
      };

      if (ingrediente?.id) {
        await api.ingredientes.update(ingrediente.id, data);
      } else {
        await api.ingredientes.create(data);
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
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {ingrediente?.id ? '✏️ Editar Ingrediente' : '➕ Nuevo Ingrediente'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre del producto</label>
              <input
                type="text"
                className="form-input"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Macarrones integrales Hacendado"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Supermercado</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.supermercado}
                  onChange={e => setForm({ ...form, supermercado: e.target.value })}
                />
              </div>
            </div>

            <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
              📊 Información Nutricional (por 100g)
            </h4>

            <div className="form-row-4">
              <div className="form-group">
                <label className="form-label">Calorías (kcal)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={form.calorias_por_100g}
                  onChange={e => setForm({ ...form, calorias_por_100g: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Proteínas (g)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={form.proteinas_por_100g}
                  onChange={e => setForm({ ...form, proteinas_por_100g: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Carbohidratos (g)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={form.carbohidratos_por_100g}
                  onChange={e => setForm({ ...form, carbohidratos_por_100g: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Grasas (g)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={form.grasas_por_100g}
                  onChange={e => setForm({ ...form, grasas_por_100g: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fibra (g) - opcional</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={form.fibra_por_100g}
                  onChange={e => setForm({ ...form, fibra_por_100g: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.notas || ''}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar ingrediente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Ingredientes() {
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadIngredientes();
  }, [search, categoriaFilter]);

  async function loadIngredientes() {
    try {
      const params = {};
      if (search) params.q = search;
      if (categoriaFilter) params.categoria = categoriaFilter;
      const data = await api.ingredientes.list(params);
      setIngredientes(data);
    } catch (error) {
      console.error('Error loading ingredientes:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function handleNew() {
    setEditingItem(null);
    setModalOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este ingrediente?')) return;
    try {
      await api.ingredientes.delete(id);
      loadIngredientes();
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
    loadIngredientes();
  }

  const grouped = ingredientes.reduce((acc, ing) => {
    const cat = ing.categoria || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ing);
    return acc;
  }, {});

  return (
    <div>
      <header className="page-header">
        <div className="flex flex-between flex-center">
          <div>
            <h1 className="page-title">📦 Ingredientes</h1>
            <p className="page-subtitle">Gestiona los ingredientes de Mercadona</p>
          </div>
          <button className="btn btn-primary" onClick={handleNew}>
            + Añadir ingrediente
          </button>
        </div>
      </header>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="category-filter">
        <button
          className={`category-btn ${categoriaFilter === '' ? 'active' : ''}`}
          onClick={() => setCategoriaFilter('')}
        >
          Todos
        </button>
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            className={`category-btn ${categoriaFilter === cat ? 'active' : ''}`}
            onClick={() => setCategoriaFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : ingredientes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3 className="empty-state-title">No hay ingredientes</h3>
          <p>Añade tu primer ingrediente para empezar</p>
        </div>
      ) : (
        <div>
          {Object.entries(grouped).map(([categoria, items]) => (
            <div key={categoria} style={{ marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                {categoria} ({items.length})
              </h3>
              <div className="grid grid-2">
                {items.map(ing => (
                  <div key={ing.id} className="card">
                    <div className="flex flex-between flex-center" style={{ marginBottom: '8px' }}>
                      <h4>{ing.nombre}</h4>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(ing)}>
                          Editar
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ing.id)}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                      Por 100g: {Math.round(ing.calorias_por_100g)} kcal | 
                      {Math.round(ing.proteinas_por_100g)}g prot | 
                      {Math.round(ing.carbohidratos_por_100g)}g carb | 
                      {Math.round(ing.grasas_por_100g)}g grasas
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <IngredienteModal
          ingrediente={editingItem}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Ingredientes;
