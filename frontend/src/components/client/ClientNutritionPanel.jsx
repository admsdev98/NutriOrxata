import { useState, useEffect } from 'react';
import api from '../../api/client';

function roundToOneDecimal(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

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

function getPlatoMomentos(plato) {
  if (!plato) return [];
  if (Array.isArray(plato.momentos_dia) && plato.momentos_dia.length > 0) {
    return plato.momentos_dia;
  }
  if (plato.momento_dia) return [plato.momento_dia];
  return [];
}

function ClientNutritionPanel({ user, onSave }) {
  const [platos, setPlatos] = useState([]);
  const [platosAsociados, setPlatosAsociados] = useState([]);
  const [libraryFilter, setLibraryFilter] = useState('');
  const [selectedMoment, setSelectedMoment] = useState('desayuno');
  const [expandedPlatoId, setExpandedPlatoId] = useState(null);
  const [savingPlatoId, setSavingPlatoId] = useState(null);
  const [loadingPlatos, setLoadingPlatos] = useState(true);
  const [adjustments, setAdjustments] = useState({});
  const [adjustMode, setAdjustMode] = useState('manual');
  const [distribution, setDistribution] = useState({
    desayuno: 25,
    almuerzo: 10,
    comida: 35,
    merienda: 10,
    cena: 20,
  });
  const [savingDistribution, setSavingDistribution] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPlatos();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    setDistribution({
      desayuno: user.distribucion_desayuno ?? 25,
      almuerzo: user.distribucion_almuerzo ?? 10,
      comida: user.distribucion_comida ?? 35,
      merienda: user.distribucion_merienda ?? 10,
      cena: user.distribucion_cena ?? 20,
    });
  }, [user]);

  async function loadPlatos() {
    try {
      setLoadingPlatos(true);
      const [platosResult, asociadosResult] = await Promise.allSettled([
        api.platos.list(),
        api.clientesPlatos.list(user.id),
      ]);

      if (platosResult.status === 'fulfilled') {
        const platosDisponibles = platosResult.value;
        setPlatos(platosDisponibles?.items || platosDisponibles || []);
      }

      if (asociadosResult.status === 'fulfilled') {
        const asociados = asociadosResult.value;
        setPlatosAsociados(asociados?.items || asociados || []);
      }
    } catch (error) {
      console.error('Error loading platos:', error);
    } finally {
      setLoadingPlatos(false);
    }
  }

  function setAdjustment(platoId, key, value) {
    setAdjustments(prev => ({
      ...prev,
      [platoId]: {
        ...(prev[platoId] || {}),
        [key]: value,
      }
    }));
  }

  function applyScale(plato, mode) {
    const targetValue = parseFloat(adjustments[plato.id]?.[mode]) || 0;
    const baseValue = mode === 'kcal' ? plato.calorias_totales : plato.peso_total_gramos;

    if (!targetValue || !baseValue) return;

    const factor = targetValue / baseValue;
    setPlatosAsociados(prev => prev.map(p => {
      if (p.id !== plato.id) return p;
      return {
        ...p,
        ingredientes: p.ingredientes.map(i => ({
          ...i,
          cantidad_gramos: roundToOneDecimal((parseFloat(i.cantidad_gramos) || 0) * factor),
        }))
      };
    }));

    setAdjustments(prev => ({
      ...prev,
      [plato.id]: {
        ...(prev[plato.id] || {}),
        [mode]: '',
      }
    }));
  }

  async function assignPlatosToMomento(platoIds, momento) {
    if (!platoIds.length) return;
    try {
      await Promise.all(
        platoIds.map(platoId =>
          api.clientesPlatos.create(user.id, {
            plato_id: parseInt(platoId, 10),
            momentos_dia: [momento],
          })
        )
      );
      await loadPlatos();
    } catch (err) {
      alert(err.message);
    }
  }

  function getDistributionPercent(momento) {
    return Number(distribution[momento] ?? 0);
  }

  async function applyDistributionToMoment(momento) {
    const objetivoBase = parseFloat(user.calorias_objetivo || user.calorias_mantenimiento) || 0;
    if (!objetivoBase) {
      alert('Define las kcal objetivo en Objetivos para aplicar distribucion.');
      return;
    }
    const asociadosResponse = await api.clientesPlatos.list(user.id);
    const asociados = asociadosResponse?.items || asociadosResponse || [];
    const platosDelMomento = asociados.filter(p => (p.momentos_dia || []).includes(momento));
    if (!platosDelMomento.length) return;
    const percent = getDistributionPercent(momento);
    const targetTotal = (objetivoBase * percent) / 100;
    if (!targetTotal) return;
    await scalePlatosForTarget(platosDelMomento, targetTotal);
  }

  async function scalePlatosForTarget(platosDelMomento, targetTotal, options = {}) {
    const targetPerPlato = targetTotal / platosDelMomento.length;

    try {
      for (const plato of platosDelMomento) {
        const baseValue = plato.calorias_totales;
        if (!baseValue) continue;
        const factor = targetPerPlato / baseValue;
        const ingredientes = plato.ingredientes.map(i => ({
          ingrediente_id: i.ingrediente_id,
          cantidad_gramos: roundToOneDecimal((parseFloat(i.cantidad_gramos) || 0) * factor),
        }));
        await api.clientesPlatos.update(user.id, plato.id, { ingredientes });
      }
      if (!options.skipReload) {
        loadPlatos();
      }
    } catch (err) {
      alert(err.message);
    }
  }

  async function saveDistribution() {
    try {
      setSavingDistribution(true);
      await api.auth.updateUser(user.id, {
        distribucion_desayuno: parseFloat(distribution.desayuno) || 0,
        distribucion_almuerzo: parseFloat(distribution.almuerzo) || 0,
        distribucion_comida: parseFloat(distribution.comida) || 0,
        distribucion_merienda: parseFloat(distribution.merienda) || 0,
        distribucion_cena: parseFloat(distribution.cena) || 0,
      });
      if (onSave) onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingDistribution(false);
    }
  }

  async function handleAddPlato(platoId) {
    await assignPlatosToMomento([platoId], selectedMoment);
    if (adjustMode === 'percent') {
      await applyDistributionToMoment(selectedMoment);
    }
  }

  async function handleDeletePlato(id) {
    if (!window.confirm('¿Eliminar este plato asociado?')) return;
    try {
      await api.clientesPlatos.delete(user.id, id);
      loadPlatos();
    } catch (err) {
      alert(err.message);
    }
  }

  function updateIngrediente(platoId, ingredienteId, value) {
    setPlatosAsociados(prev => prev.map(p => {
      if (p.id !== platoId) return p;
      return {
        ...p,
        ingredientes: p.ingredientes.map(i =>
          i.ingrediente_id === ingredienteId
            ? { ...i, cantidad_gramos: value }
            : i
        )
      };
    }));
  }

  async function handleSavePlato(plato) {
    try {
      setSavingPlatoId(plato.id);
      await api.clientesPlatos.update(user.id, plato.id, {
        ingredientes: plato.ingredientes.map(i => ({
          ingrediente_id: i.ingrediente_id,
          cantidad_gramos: parseFloat(i.cantidad_gramos) || 0,
        }))
      });
      loadPlatos();
      setExpandedPlatoId(null);
      if (onSave) onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPlatoId(null);
    }
  }

  const libraryTokens = getSearchTokens(libraryFilter);
  const filteredPlatos = platos.filter(plato => {
    const combined = `${plato.nombre || ''} ${plato.descripcion || ''}`;
    const matchesSearch = matchesTokens(combined, libraryTokens);
    const momentos = getPlatoMomentos(plato);
    const matchesMomento = momentos.length === 0 || momentos.includes(selectedMoment);
    return matchesSearch && matchesMomento;
  });

  const platosByMomento = MOMENTOS.reduce((acc, momento) => {
    acc[momento] = platosAsociados.filter(plato => (plato.momentos_dia || []).includes(momento));
    return acc;
  }, {});
  
  const associatedMomentsMap = platosAsociados.reduce((acc, plato) => {
    const baseId = plato.plato_id ?? plato.platoId;
    if (!baseId) return acc;
    const key = String(baseId);
    const current = acc.get(key) || new Set();
    (plato.momentos_dia || []).forEach(m => current.add(m));
    acc.set(key, current);
    return acc;
  }, new Map());
  
  const distributionTotal = MOMENTOS.reduce((acc, momento) => acc + (Number(distribution[momento]) || 0), 0);
  const objetivoBase = parseFloat(user?.calorias_objetivo || user?.calorias_mantenimiento) || 0;
  const distributionTotalKcal = objetivoBase ? Math.round((objetivoBase * distributionTotal) / 100) : 0;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border">
          <div>
            <h3 className="font-bold text-lg">Planificador Semanal</h3>
            <div className="text-secondary text-sm">Organiza las comidas de la semana</div>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${adjustMode === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-main'}`}
              onClick={() => setAdjustMode('manual')}
            >
              Manual
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${adjustMode === 'percent' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-main'}`}
              onClick={() => setAdjustMode('percent')}
            >
              Porcentajes
            </button>
          </div>
        </div>

          {adjustMode === 'percent' && (
              <div className="card p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">📊 Porcentajes Diarios</h4>
                    <p className="text-sm text-secondary">La distribución se aplica automáticamente a las comidas.</p>
                  </div>
                  <div className={`text-sm font-medium ${Math.round(distributionTotal) === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    Total {Math.round(distributionTotal)}% · {distributionTotalKcal ? `${distributionTotalKcal} kcal` : 'Sin objetivo'}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {MOMENTOS.map(momento => {
                    const percent = Number(distribution[momento]) || 0;
                    const kcalValue = objetivoBase ? Math.round((objetivoBase * percent) / 100) : 0;
                    return (
                      <div key={momento} className="bg-gray-50 p-3 rounded-lg border border-border">
                        <div className="text-sm font-medium mb-2">{MOMENTOS_DISPLAY[momento].label}</div>
                        <div className="flex items-center gap-1 mb-1">
                          <input
                            type="number"
                            className="w-full bg-white border border-border rounded px-2 py-1 text-sm text-center"
                            value={distribution[momento]}
                            onChange={e => setDistribution(prev => ({ ...prev, [momento]: e.target.value }))}
                          />
                          <span className="text-muted text-xs">%</span>
                        </div>
                        <div className="text-xs text-secondary text-center">
                          {kcalValue ? `${kcalValue} kcal` : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <button type="button" className="btn btn-primary btn-sm" onClick={saveDistribution} disabled={savingDistribution}>
                    {savingDistribution ? 'Guardando...' : 'Guardar Distribución'}
                  </button>
                </div>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
             {/* LEFT PANE: SELECTOR & TABS (Taking 5 columns on large screens) */}
             <div className="lg:col-span-5 space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto no-scrollbar">
                    {MOMENTOS.map(momento => (
                    <button
                        key={momento}
                        type="button"
                        className={`flex-1 min-w-[max-content] px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2
                            ${selectedMoment === momento 
                                ? 'bg-white shadow text-primary border border-gray-200' 
                                : 'text-secondary hover:bg-white/50 hover:text-main'}`}
                        onClick={() => setSelectedMoment(momento)}
                    >
                        <span>{MOMENTOS_DISPLAY[momento].icon}</span>
                        <span className="hidden md:inline">{MOMENTOS_DISPLAY[momento].label}</span>
                    </button>
                    ))}
                </div>

                <div className="card h-[600px] flex flex-col p-0 overflow-hidden">
                   <div className="p-4 border-b border-border bg-gray-50">
                       <h5 className="font-bold text-sm uppercase tracking-wide text-secondary mb-3">Biblioteca de Platos</h5>
                       <input
                        type="text"
                        className="form-input w-full"
                        value={libraryFilter}
                        onChange={e => setLibraryFilter(e.target.value)}
                        placeholder={`Buscar para ${MOMENTOS_DISPLAY[selectedMoment].label}...`}
                      />
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {filteredPlatos.length === 0 ? (
                           <div className="p-8 text-center text-secondary text-sm">
                               No se encontraron platos para este momento.
                           </div>
                        ) : (
                            filteredPlatos.map(plato => {
                                const momentos = getPlatoMomentos(plato);
                                const assigned = associatedMomentsMap.get(String(plato.id));
                                return (
                                  <div key={plato.id} className="p-3 bg-white border border-border rounded-lg hover:border-primary transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-medium text-main line-clamp-2 text-sm">{plato.nombre}</div>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleAddPlato(plato.id)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                         {momentos.map(m => (
                                             <span key={m} className="px-1.5 py-0.5 bg-gray-100 text-secondary text-[10px] uppercase font-bold rounded">
                                                 {m.substring(0,3)}
                                             </span>
                                         ))}
                                    </div>
                                    <div className="text-secondary text-xs flex justify-between items-center">
                                        <span>{Math.round(plato.calorias_totales)} kcal</span>
                                        {assigned && assigned.size > 0 && <span className="text-primary font-bold">Asignado</span>}
                                    </div>
                                  </div>
                                );
                            })
                        )}
                   </div>
                </div>
             </div>

             {/* RIGHT PANE: SELECTED MEALS (Taking 7 columns) */}
             <div className="lg:col-span-7">
                <div className="card min-h-[600px] p-0 flex flex-col">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <div>
                             <h4 className="font-bold text-main">{MOMENTOS_DISPLAY[selectedMoment].label}</h4>
                             <div className="text-xs text-secondary">{platosByMomento[selectedMoment].length} platos seleccionados</div>
                        </div>
                        {adjustMode === 'percent' && platosByMomento[selectedMoment].length > 0 && (
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm text-xs"
                                onClick={() => applyDistributionToMoment(selectedMoment)}
                            >
                                ⚡ Ajustar Kcal
                            </button>
                        )}
                    </div>

                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                         {loadingPlatos ? (
                             <div className="py-20 flex justify-center"><div className="spinner" /></div>
                         ) : platosByMomento[selectedMoment].length === 0 ? (
                             <div className="py-20 text-center flex flex-col items-center justify-center h-full">
                                 <div className="text-4xl mb-4 opacity-50">🍽️</div>
                                 <p className="text-secondary font-medium">No has asignado platos para {MOMENTOS_DISPLAY[selectedMoment].label}</p>
                                 <p className="text-secondary text-sm mt-2">Selecciona platos del panel izquierdo.</p>
                             </div>
                         ) : (
                             platosByMomento[selectedMoment].map(plato => {
                                 const currentAdjust = adjustments[plato.id] || {};
                                 const isExpanded = expandedPlatoId === plato.id;
                                 
                                 return (
                                     <div key={plato.id} className={`border border-border rounded-xl overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-primary-100 border-primary-300' : 'bg-white'}`}>
                                         <div className="p-4 flex gap-4 items-center">
                                             <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                                                 {selectedMoment === 'desayuno' ? '☕' : selectedMoment === 'cena' ? '🌙' : '🥗'}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <div className="font-bold text-main truncate">{plato.plato_nombre}</div>
                                                 <div className="text-sm text-secondary flex gap-3">
                                                     <span>🔥 {Math.round(plato.calorias_totales)} kcal</span>
                                                     <span>⚖️ {plato.peso_total_gramos} g</span>
                                                 </div>
                                             </div>
                                             <div className="flex gap-2">
                                                 <button 
                                                     onClick={() => setExpandedPlatoId(isExpanded ? null : plato.id)}
                                                     className={`btn btn-sm ${isExpanded ? 'btn-primary' : 'btn-secondary'}`}
                                                 >
                                                     {isExpanded ? 'Listo' : 'Editar'}
                                                 </button>
                                                 <button 
                                                     onClick={() => handleDeletePlato(plato.id)}
                                                     className="btn btn-sm btn-outline text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                 >
                                                     🗑️
                                                 </button>
                                             </div>
                                         </div>

                                         {isExpanded && (
                                             <div className="p-4 bg-gray-50 border-t border-border space-y-4">
                                                 {/* Quick Scale Tools */}
                                                 <div className="grid grid-cols-2 gap-4">
                                                     <div className="form-group mb-0">
                                                         <label className="text-xs font-bold text-secondary uppercase mb-1 block">Ajustar a Kcal</label>
                                                         <div className="flex gap-2">
                                                             <input 
                                                                 type="number" 
                                                                 className="form-input flex-1 py-1 text-sm" 
                                                                 placeholder="Ej: 500"
                                                                 value={currentAdjust.kcal || ''}
                                                                 onChange={e => setAdjustment(plato.id, 'kcal', e.target.value)}
                                                             />
                                                             <button 
                                                                 className="btn btn-secondary btn-sm"
                                                                 onClick={() => applyScale(plato, 'kcal')}
                                                             >
                                                                 Aplicar
                                                             </button>
                                                         </div>
                                                     </div>
                                                     <div className="form-group mb-0">
                                                         <label className="text-xs font-bold text-secondary uppercase mb-1 block">Ajustar a Gramos</label>
                                                         <div className="flex gap-2">
                                                             <input 
                                                                 type="number" 
                                                                 className="form-input flex-1 py-1 text-sm" 
                                                                 placeholder="Ej: 300"
                                                                 value={currentAdjust.gramos || ''}
                                                                 onChange={e => setAdjustment(plato.id, 'gramos', e.target.value)}
                                                             />
                                                             <button 
                                                                 className="btn btn-secondary btn-sm"
                                                                 onClick={() => applyScale(plato, 'gramos')}
                                                             >
                                                                 Aplicar
                                                             </button>
                                                         </div>
                                                     </div>
                                                 </div>

                                                 <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                                                     <label className="text-xs font-bold text-secondary uppercase">Ingredientes (g)</label>
                                                     {plato.ingredientes.map(ing => (
                                                         <div key={ing.ingrediente_id} className="flex justify-between items-center text-sm gap-4">
                                                             <span className="truncate flex-1">{ing.ingrediente_nombre}</span>
                                                             <input 
                                                                 type="number" 
                                                                 className="form-input w-24 py-1 text-right"
                                                                 value={ing.cantidad_gramos}
                                                                 onChange={e => updateIngrediente(plato.id, ing.ingrediente_id, e.target.value)}
                                                             />
                                                         </div>
                                                     ))}
                                                 </div>

                                                 <div className="flex justify-end pt-2">
                                                     <button 
                                                         onClick={() => handleSavePlato(plato)}
                                                         className="btn btn-primary btn-sm w-full md:w-auto"
                                                         disabled={savingPlatoId === plato.id}
                                                     >
                                                         {savingPlatoId === plato.id ? 'Guardando...' : 'Guardar Cambios'}
                                                     </button>
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 );
                             })
                         )}
                    </div>
                </div>
             </div>
          </div>
    </div>
  );
}

export default ClientNutritionPanel;
