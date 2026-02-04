import { useState, useEffect } from 'react';
import api from '../api/client';

const MOMENTOS = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
const MOMENTOS_DISPLAY = {
  desayuno: { icon: '🌅', label: 'Desayuno', color: 'bg-orange-100 text-orange-700' },
  almuerzo: { icon: '🥪', label: 'Almuerzo', color: 'bg-blue-100 text-blue-700' },
  comida: { icon: '☀️', label: 'Comida', color: 'bg-yellow-100 text-yellow-700' },
  merienda: { icon: '🍎', label: 'Merienda', color: 'bg-orange-100 text-orange-700' },
  cena: { icon: '🌙', label: 'Cena', color: 'bg-indigo-100 text-indigo-700' },
};

function normalizeText(value) {
  return (value || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getSearchTokens(value) {
  return normalizeText(value).trim().split(/\s+/)
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

function PlatoModal({ plato, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: plato?.nombre || '',
    descripcion: plato?.descripcion || '',
    momentos_dia: plato?.momentos_dia?.length ? plato.momentos_dia : (plato?.momento_dia ? [plato.momento_dia] : ['comida']),
  });
  const [ingredientesPlato, setIngredientesPlato] = useState([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [searchIng, setSearchIng] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load ingredients and detailed plato data
    api.ingredientes.list().then(setIngredientesDisponibles).catch(console.error);
    if (plato?.id) {
       api.platos.get(plato.id).then(detail => {
           setIngredientesPlato(detail.ingredientes.map(pi => ({
               id: pi.ingrediente_id,
               nombre: pi.ingrediente_nombre,
               cantidad_gramos: pi.cantidad_gramos,
               calorias_por_100g: (pi.calorias_aportadas / pi.cantidad_gramos) * 100,
               proteinas_por_100g: (pi.proteinas_aportadas / pi.cantidad_gramos) * 100,
               carbohidratos_por_100g: (pi.carbohidratos_aportados / pi.cantidad_gramos) * 100,
               grasas_por_100g: (pi.grasas_aportadas / pi.cantidad_gramos) * 100,
           })));
       }).catch(console.error);
    }
  }, []);

  const addIngrediente = (ing) => {
    if (ingredientesPlato.find(i => i.id === ing.id)) return;
    setIngredientesPlato([...ingredientesPlato, { ...ing, cantidad_gramos: 100 }]);
    setSearchIng('');
  };

  const updateCantidad = (idx, val) => {
      const copy = [...ingredientesPlato];
      copy[idx].cantidad_gramos = parseFloat(val) || 0;
      setIngredientesPlato(copy);
  };

  const removeIngrediente = (idx) => {
      setIngredientesPlato(ingredientesPlato.filter((_, i) => i !== idx));
  };

  const toggleMomento = (momento) => {
      setForm(prev => ({
          ...prev,
          momentos_dia: prev.momentos_dia.includes(momento) 
             ? prev.momentos_dia.filter(m => m !== momento)
             : [...prev.momentos_dia, momento]
      }));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      if(!form.momentos_dia.length) return alert('Elige al menos un momento del día');
      if(!ingredientesPlato.length) return alert('Añade ingredientes');
      
      setSaving(true);
      try {
          const payload = {
              ...form,
              ingredientes: ingredientesPlato.map(i => ({ ingrediente_id: i.id, cantidad_gramos: i.cantidad_gramos }))
          };
          plato?.id ? await api.platos.update(plato.id, payload) : await api.platos.create(payload);
          onSave();
      } catch(err) { alert(err.message); } finally { setSaving(false); }
  };

  const nutri = calcularNutricion(ingredientesPlato);
  const filteredIngs = ingredientesDisponibles.filter(i => 
     !ingredientesPlato.find(ip => ip.id === i.id) && 
     i.nombre.toLowerCase().includes(searchIng.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="modal-header shrink-0">
            <h2 className="modal-title text-xl font-bold text-primary-600">{plato?.id ? '✏️ Editar Plato' : '🍽️ Nuevo Plato'}</h2>
            <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="modal-body overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="form-label">Nombre</label>
                        <input className="form-input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required placeholder="Ej: Paella Valenciana" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <input className="form-input" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Opcional..." />
                    </div>
                </div>

                <div className="form-group mb-6">
                    <label className="form-label mb-2 block">Momentos del día</label>
                    <div className="flex flex-wrap gap-2">
                        {MOMENTOS.map(m => (
                            <button 
                                key={m}
                                type="button"
                                onClick={() => toggleMomento(m)}
                                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${form.momentos_dia.includes(m) ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-border hover:border-primary'}`}
                            >
                                {MOMENTOS_DISPLAY[m].icon} {MOMENTOS_DISPLAY[m].label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-input p-4 rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-secondary uppercase text-sm">Ingredientes</h4>
                        <div className="text-secondary text-xs">{ingredientesPlato.length} añadidos</div>
                    </div>
                    
                    <div className="relative mb-4">
                        <input 
                            className="form-input pl-8" 
                            placeholder="Buscar ingrediente para añadir..." 
                            value={searchIng}
                            onChange={e => setSearchIng(e.target.value)}
                        />
                         <span className="absolute left-3 top-3 text-secondary">🔍</span>
                        
                        {searchIng && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-border shadow-lg rounded-lg mt-1 z-10 max-h-48 overflow-y-auto">
                                {filteredIngs.map(ing => (
                                    <button 
                                        key={ing.id} 
                                        type="button"
                                        onClick={() => addIngrediente(ing)}
                                        className="w-full text-left p-2 hover:bg-input text-sm border-b border-border last:border-0 flex justify-between"
                                    >
                                        <span>{ing.nombre}</span>
                                        <span className="text-secondary text-xs">{Math.round(ing.calorias_por_100g)} kcal</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        {ingredientesPlato.map((ing, idx) => (
                            <div key={ing.id} className="bg-white p-2 rounded shadow-sm border border-border flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{ing.nombre}</div>
                                    <div className="text-xs text-secondary">
                                        {(ing.calorias_por_100g * ing.cantidad_gramos/100).toFixed(0)} kcal
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        className="form-input text-center py-1 px-1 h-8 w-16 text-sm"
                                        value={ing.cantidad_gramos}
                                        onChange={e => updateCantidad(idx, e.target.value)}
                                    />
                                    <span className="text-xs text-secondary">g</span>
                                    <button type="button" onClick={() => removeIngrediente(idx)} className="text-error hover:bg-error-50 rounded p-1">✕</button>
                                </div>
                            </div>
                        ))}
                        {!ingredientesPlato.length && <div className="text-center text-sm text-secondary italic py-2">No hay ingredientes.</div>}
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
                        <div className="text-center">
                            <div className="text-xl font-bold text-primary">{nutri.calorias.toFixed(0)}</div>
                            <div className="text-[10px] uppercase text-secondary font-bold">Kcal</div>
                        </div>
                        <div className="text-center border-l border-border">
                            <div className="text-lg font-bold">{nutri.proteinas.toFixed(1)}</div>
                            <div className="text-[10px] uppercase text-secondary">Prot</div>
                        </div>
                        <div className="text-center border-l border-border">
                            <div className="text-lg font-bold">{nutri.carbohidratos.toFixed(1)}</div>
                            <div className="text-[10px] uppercase text-secondary">Carb</div>
                        </div>
                        <div className="text-center border-l border-border">
                            <div className="text-lg font-bold">{nutri.grasas.toFixed(1)}</div>
                            <div className="text-[10px] uppercase text-secondary">Grasas</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-footer shrink-0">
                 <div className="mr-auto text-sm text-secondary">Peso total: <b>{nutri.peso}g</b></div>
                 <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                 <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Plato'}</button>
            </div>
        </form>
      </div>
    </div>
  );
}

function Platos() {
  const [platos, setPlatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMomento, setFilterMomento] = useState('todos');

  useEffect(() => { loadPlatos(); }, []);

  const loadPlatos = async () => {
    try {
        const data = await api.platos.list();
        setPlatos(data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
      if(!confirm('¿Eliminar plato?')) return;
      try { await api.platos.delete(id); loadPlatos(); } catch(e) { alert(e.message); }
  };

  const getMomentos = (p) => {
     if(p.momentos_dia?.length) return p.momentos_dia;
     if(p.momento_dia) return [p.momento_dia];
     return [];
  };

  const filtered = platos.filter(p => {
      if(filterMomento !== 'todos' && !getMomentos(p).includes(filterMomento)) return false;
      if(search && !normalizeText(p.nombre).includes(normalizeText(search))) return false;
      return true;
  });

  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="page-title">Platos</h1>
                <p className="page-subtitle">Recetario y composiciones</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                + Crear Plato
            </button>
        </div>

        <div className="card p-4 mb-6">
            <div className="flex gap-4 flex-col md:flex-row">
                 <div className="relative flex-1">
                    <input 
                        className="form-input pl-10" 
                        placeholder="Buscar plato..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <span className="absolute left-3 top-3 text-secondary">🔍</span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button 
                         className={`px-3 py-2 rounded-full text-sm font-medium border whitespace-nowrap ${filterMomento === 'todos' ? 'bg-primary text-white border-primary' : 'bg-white text-secondary hover:border-primary'}`}
                         onClick={() => setFilterMomento('todos')}
                    >
                        Todos
                    </button>
                    {MOMENTOS.map(m => (
                        <button
                             key={m}
                             className={`px-3 py-2 rounded-full text-sm font-medium border whitespace-nowrap ${filterMomento === m ? 'bg-primary text-white border-primary' : 'bg-white text-secondary hover:border-primary'}`}
                             onClick={() => setFilterMomento(m)}
                        >
                            {MOMENTOS_DISPLAY[m].icon} {MOMENTOS_DISPLAY[m].label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {loading ? <div className="spinner mx-auto" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(plato => (
                    <div key={plato.id} className="card p-0 overflow-hidden hover:shadow-lg transition-all group">
                         <div className="p-4 border-b border-border bg-gradient-to-br from-white to-gray-50 flex justify-between items-start">
                             <div>
                                 <h3 className="font-bold text-lg text-main mb-1">{plato.nombre}</h3>
                                 <div className="flex gap-1 flex-wrap">
                                     {getMomentos(plato).map(m => (
                                         <span key={m} className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wide border border-border bg-white text-secondary`}>
                                            {MOMENTOS_DISPLAY[m].label}
                                         </span>
                                     ))}
                                 </div>
                             </div>
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white p-1 rounded border shadow-sm">
                                 <button onClick={() => { setEditingItem(plato); setModalOpen(true); }} className="hover:bg-input p-1 rounded text-lg" title="Editar">✏️</button>
                                 <button onClick={() => handleDelete(plato.id)} className="hover:bg-error-50 text-error p-1 rounded text-lg" title="Borrar">🗑️</button>
                             </div>
                         </div>
                         
                         <div className="p-4">
                             {plato.descripcion && <p className="text-secondary text-sm mb-4 line-clamp-2">{plato.descripcion}</p>}
                             
                             <div className="grid grid-cols-4 gap-2 text-center bg-input rounded-lg p-2">
                                 <div>
                                     <div className="font-bold text-primary">{Math.round(plato.calorias_totales)}</div>
                                     <div className="text-[10px] uppercase text-secondary">kcal</div>
                                 </div>
                                 <div className="border-l border-border">
                                     <div className="font-bold">{Math.round(plato.proteinas_totales)}</div>
                                     <div className="text-[10px] uppercase text-secondary">Prot</div>
                                 </div>
                                 <div className="border-l border-border">
                                     <div className="font-bold">{Math.round(plato.carbohidratos_totales)}</div>
                                     <div className="text-[10px] uppercase text-secondary">Carb</div>
                                 </div>
                                 <div className="border-l border-border">
                                     <div className="font-bold">{Math.round(plato.grasas_totales)}</div>
                                     <div className="text-[10px] uppercase text-secondary">Fat</div>
                                 </div>
                             </div>
                         </div>
                    </div>
                ))}
            </div>
        )}

      {modalOpen && (
        <PlatoModal
          plato={editingItem}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); loadPlatos(); }}
        />
      )}
    </div>
  );
}

export default Platos;
