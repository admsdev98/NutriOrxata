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
          <h2 className="modal-title font-bold text-xl text-primary-600">
            {ingrediente?.id ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
          </h2>
          <button className="btn-icon" onClick={onClose}>X</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body space-y-4">
            <div className="form-group">
                <label className="form-label">Nombre del producto</label>
                <input
                    type="text"
                    className="form-input font-medium"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Macarrones integrales Hacendado"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select
                        className="form-select"
                        value={form.categoria}
                        onChange={e => setForm({ ...form, categoria: e.target.value })}
                    >
                        {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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

            <div className="bg-input p-4 rounded-lg border border-border mt-2">
                <h4 className="text-secondary font-semibold text-sm mb-3 uppercase tracking-wide">
                Información Nutricional (por 100g)
                </h4>
                <div className="grid grid-cols-4 gap-2">
                    <div className="form-group">
                        <label className="form-label text-xs">Calorías</label>
                        <input
                             type="number" step="0.1" className="form-input text-center"
                             value={form.calorias_por_100g}
                             onChange={e => setForm({ ...form, calorias_por_100g: e.target.value })}
                             required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">Prot (g)</label>
                        <input
                             type="number" step="0.1" className="form-input text-center"
                             value={form.proteinas_por_100g}
                             onChange={e => setForm({ ...form, proteinas_por_100g: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">Carb (g)</label>
                        <input
                             type="number" step="0.1" className="form-input text-center"
                             value={form.carbohidratos_por_100g}
                             onChange={e => setForm({ ...form, carbohidratos_por_100g: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label text-xs">Grasas (g)</label>
                        <input
                             type="number" step="0.1" className="form-input text-center"
                             value={form.grasas_por_100g}
                             onChange={e => setForm({ ...form, grasas_por_100g: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Ingrediente'}
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ingrediente?')) return;
    try {
      await api.ingredientes.delete(id);
      loadIngredientes();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    setEditingItem(null);
    loadIngredientes();
  };

  const grouped = ingredientes.reduce((acc, ing) => {
    const cat = ing.categoria || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ing);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="page-title">Ingredientes</h1>
                <p className="page-subtitle">Gestiona tu base de datos de alimentos</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                + Nuevo Ingrediente
            </button>
        </div>

        <div className="card p-4 mb-6">
            <div className="flex gap-4 flex-col md:flex-row">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Buscar ingrediente..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <button 
                        className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${categoriaFilter === '' ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-border hover:border-primary'}`}
                        onClick={() => setCategoriaFilter('')}
                    >
                        Todos
                    </button>
                    {CATEGORIAS.map(cat => (
                        <button
                            key={cat}
                            className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${categoriaFilter === cat ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-border hover:border-primary'}`}
                            onClick={() => setCategoriaFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {loading ? <div className="spinner mx-auto"></div> : (
            <div>
                {Object.entries(grouped).map(([categoria, items]) => (
                    <div key={categoria} className="mb-8">
                        <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
                            {categoria} 
                            <span className="text-xs bg-input px-2 py-1 rounded-full text-secondary font-normal">{items.length}</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(ing => (
                                <div key={ing.id} className="card p-4 hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-main">{ing.nombre}</h4>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 absolute top-2 right-2 bg-white p-1 rounded shadow-sm border border-border">
                                            <button type="button" onClick={() => { setEditingItem(ing); setModalOpen(true); }} className="btn btn-secondary btn-sm">Editar</button>
                                            <button type="button" onClick={() => handleDelete(ing.id)} className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--accent-error)' }}>Borrar</button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-secondary mb-3">{ing.supermercado || 'Genérico'}</div>
                                    <div className="flex justify-between items-center text-sm bg-input rounded p-2">
                                        <div className="text-center px-2 border-r border-border last:border-0">
                                            <div className="font-bold text-primary">{Math.round(ing.calorias_por_100g)}</div>
                                            <div className="text-[10px] uppercase text-secondary">kcal</div>
                                        </div>
                                        <div className="text-center px-2 border-r border-border last:border-0">
                                            <div className="font-bold">{Math.round(ing.proteinas_por_100g)}</div>
                                            <div className="text-[10px] uppercase text-secondary">PRO</div>
                                        </div>
                                        <div className="text-center px-2 border-r border-border last:border-0">
                                            <div className="font-bold">{Math.round(ing.carbohidratos_por_100g)}</div>
                                            <div className="text-[10px] uppercase text-secondary">CARB</div>
                                        </div>
                                        <div className="text-center px-2">
                                            <div className="font-bold">{Math.round(ing.grasas_por_100g)}</div>
                                            <div className="text-[10px] uppercase text-secondary">FAT</div>
                                        </div>
                                    </div>
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
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default Ingredientes;
