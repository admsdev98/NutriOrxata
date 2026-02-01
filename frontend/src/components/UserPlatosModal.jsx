import { useState, useEffect } from 'react';
import api from '../api/client';

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

function getPlatoMomentos(plato) {
  if (!plato) return [];
  if (Array.isArray(plato.momentos_dia) && plato.momentos_dia.length > 0) {
    return plato.momentos_dia;
  }
  if (plato.momento_dia) return [plato.momento_dia];
  return [];
}

function UserPlatosModal({ user, onClose, onSave }) {
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
      } else {
        setPlatos([]);
        console.error('Error loading platos disponibles:', platosResult.reason);
      }

      if (asociadosResult.status === 'fulfilled') {
        const asociados = asociadosResult.value;
        setPlatosAsociados(asociados?.items || asociados || []);
      } else {
        setPlatosAsociados([]);
        console.error('Error loading platos asociados:', asociadosResult.reason);
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

  async function applyDistributionAll() {
    const objetivoBase = parseFloat(user.calorias_objetivo || user.calorias_mantenimiento) || 0;
    if (!objetivoBase) {
      alert('Define las kcal objetivo en Objetivos para aplicar distribucion.');
      return;
    }
    const total = MOMENTOS.reduce((acc, momento) => acc + (Number(distribution[momento]) || 0), 0);
    if (Math.round(total) !== 100) {
      alert('La distribucion debe sumar 100%.');
      return;
    }

    try {
      const asociadosResponse = await api.clientesPlatos.list(user.id);
      const asociados = asociadosResponse?.items || asociadosResponse || [];
      for (const momento of MOMENTOS) {
        const platosDelMomento = asociados.filter(p => (p.momentos_dia || []).includes(momento));
        if (!platosDelMomento.length) continue;
        const percent = getDistributionPercent(momento);
        const targetTotal = (objetivoBase * percent) / 100;
        if (!targetTotal) continue;
        await scalePlatosForTarget(platosDelMomento, targetTotal, { skipReload: true });
      }
      loadPlatos();
    } catch (err) {
      alert(err.message);
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

  const normalizedFilter = libraryFilter.trim().toLowerCase();
  const filteredPlatos = platos.filter(plato => {
    const name = (plato.nombre || '').toLowerCase();
    const matchesSearch = name.includes(normalizedFilter);
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
    <div className="modal-overlay">
      <div className="modal modal-lg planner-modal">
        <div className="modal-header">
          <div>
            <h3>Planificador de platos semanales: {user.nombre}</h3>
            <div className="text-muted text-sm">Selecciona la forma de ajustar las cantidades.</div>
          </div>
          <div className="planner-mode">
            <button
              type="button"
              className={`btn btn-outline btn-sm ${adjustMode === 'manual' ? 'active' : ''}`}
              onClick={() => setAdjustMode('manual')}
            >
              Ajustar manualmente
            </button>
            <button
              type="button"
              className={`btn btn-outline btn-sm ${adjustMode === 'percent' ? 'active' : ''}`}
              onClick={() => setAdjustMode('percent')}
            >
              Ajustar por porcentajes
            </button>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body goals-body">
          {adjustMode === 'percent' && (
            <section className="goals-section">
              <div className="card goals-card panel-card compact-card">
                <div className="section-title-row">
                  <div>
                    <h4 className="section-title">Porcentajes de comida</h4>
                    <p className="section-help">Define la distribucion diaria y autoajusta las cantidades.</p>
                  </div>
                  <div className={`text-sm ${Math.round(distributionTotal) === 100 ? 'text-success' : 'text-warning'}`}>
                    Total {Math.round(distributionTotal)}% · {distributionTotalKcal ? `${distributionTotalKcal} kcal` : 'Sin objetivo'}
                  </div>
                </div>

                <div className="percent-grid">
                  {MOMENTOS.map(momento => {
                    const percent = Number(distribution[momento]) || 0;
                    const kcalValue = objetivoBase ? Math.round((objetivoBase * percent) / 100) : 0;
                    return (
                      <div key={momento} className="percent-row">
                        <div className="percent-label">{MOMENTOS_DISPLAY[momento].label}</div>
                        <div className="percent-input">
                          <input
                            type="number"
                            className="form-input"
                            value={distribution[momento]}
                            onChange={e => setDistribution(prev => ({ ...prev, [momento]: e.target.value }))}
                          />
                          <span className="text-muted">%</span>
                        </div>
                        <div className="percent-kcal">
                          {kcalValue ? `${kcalValue} kcal` : 'Sin objetivo'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="goals-actions">
                  <button type="button" className="btn btn-secondary" onClick={saveDistribution} disabled={savingDistribution}>
                    {savingDistribution ? 'Guardando...' : 'Guardar porcentajes'}
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="goals-section">
            <div className="card goals-card panel-card">
              <div className="planner-moment-tabs planner-moment-tabs--top">
                {MOMENTOS.map(momento => (
                  <button
                    key={momento}
                    type="button"
                    className={`btn btn-outline btn-sm ${selectedMoment === momento ? 'active' : ''}`}
                    onClick={() => setSelectedMoment(momento)}
                  >
                    {MOMENTOS_DISPLAY[momento].icon} {MOMENTOS_DISPLAY[momento].label}
                  </button>
                ))}
              </div>

              <div className="planner-split">
                <div className="planner-pane">
                  <div className="planner-pane-header">
                    <div>
                      <div className="form-label">Alimentos disponibles</div>
                      <div className="text-muted text-sm">Categoria: {MOMENTOS_DISPLAY[selectedMoment].label}</div>
                    </div>
                    <div className="planner-search">
                      <input
                        type="text"
                        className="form-input"
                        value={libraryFilter}
                        onChange={e => setLibraryFilter(e.target.value)}
                        placeholder="Buscar plato..."
                      />
                    </div>
                  </div>

                  <div className="platos-selector-list">
                    {filteredPlatos.length === 0 ? (
                      <div className="text-muted text-sm">No hay platos con ese filtro.</div>
                    ) : (
                      filteredPlatos.map(plato => {
                        const momentos = getPlatoMomentos(plato);
                        const assigned = associatedMomentsMap.get(String(plato.id));
                        return (
                          <div key={plato.id} className="platos-selector-item">
                            <div className="platos-item-main">
                              <div className="platos-item-name">{plato.nombre}</div>
                              <div className="platos-tags">
                                {momentos.length > 0 ? (
                                  momentos.map(momento => (
                                    <span key={momento} className={`platos-tag platos-tag--${momento}`}>
                                      {MOMENTOS_DISPLAY[momento]?.label || momento}
                                    </span>
                                  ))
                                ) : (
                                  <span className="platos-tag">Sin etiqueta</span>
                                )}
                                {assigned && assigned.size > 0 && (
                                  <span className="platos-tag platos-tag--active">Asignado</span>
                                )}
                              </div>
                            </div>
                            <div className="planner-item-meta">
                              <div className="text-muted text-sm">
                                {Math.round(plato.calorias_totales)} kcal
                              </div>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleAddPlato(plato.id)}
                              >
                                Anadir
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="planner-pane">
                  <div className="planner-pane-header">
                    <div>
                      <div className="form-label">Alimentos seleccionados</div>
                      <div className="text-muted text-sm">{platosByMomento[selectedMoment].length} platos</div>
                    </div>
                    {adjustMode === 'percent' && platosByMomento[selectedMoment].length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => applyDistributionToMoment(selectedMoment)}
                      >
                        Autoajustar por porcentajes
                      </button>
                    )}
                  </div>

                  {loadingPlatos ? (
                    <div className="loading"><div className="spinner"></div></div>
                  ) : platosByMomento[selectedMoment].length === 0 ? (
                    <div className="empty-state compact">
                      <p className="text-muted">No hay platos seleccionados.</p>
                    </div>
                  ) : (
                    <div className="momento-list">
                      {platosByMomento[selectedMoment].map(plato => {
                        const currentAdjust = adjustments[plato.id] || {};
                        return (
                          <div key={plato.id} className="momento-card">
                            <div className="momento-card-main">
                              <div className="card-title">{plato.plato_nombre}</div>
                              <div className="text-muted text-sm">
                                {Math.round(plato.calorias_totales)} kcal · {plato.peso_total_gramos} g
                              </div>
                            </div>
                            <div className="momento-card-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setExpandedPlatoId(expandedPlatoId === plato.id ? null : plato.id)}
                              >
                                {expandedPlatoId === plato.id ? 'Cerrar' : 'Editar'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeletePlato(plato.id)}
                              >
                                Quitar
                              </button>
                            </div>

                            {expandedPlatoId === plato.id && (
                              <div className="ingredients-editor">
                                <div className="plato-adjust-row">
                                  <div className="form-group">
                                    <label className="form-label">Kcal objetivo</label>
                                    <div className="inline-input">
                                      <input
                                        type="number"
                                        className="form-input"
                                        value={currentAdjust.kcal || ''}
                                        onChange={e => setAdjustment(plato.id, 'kcal', e.target.value)}
                                        placeholder="Ej: 450"
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => applyScale(plato, 'kcal')}
                                      >
                                        Aplicar kcal
                                      </button>
                                    </div>
                                  </div>
                                  <div className="form-group">
                                    <label className="form-label">Gramos objetivo</label>
                                    <div className="inline-input">
                                      <input
                                        type="number"
                                        className="form-input"
                                        value={currentAdjust.gramos || ''}
                                        onChange={e => setAdjustment(plato.id, 'gramos', e.target.value)}
                                        placeholder="Ej: 320"
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => applyScale(plato, 'gramos')}
                                      >
                                        Aplicar gramos
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {plato.ingredientes.map(ing => (
                                  <div key={ing.ingrediente_id} className="ingredient-row">
                                    <span>{ing.ingrediente_nombre}</span>
                                    <div className="ingredient-input">
                                      <input
                                        type="number"
                                        className="form-input"
                                        value={ing.cantidad_gramos}
                                        onChange={e => updateIngrediente(plato.id, ing.ingrediente_id, e.target.value)}
                                      />
                                      <span>g</span>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleSavePlato(plato)}
                                  disabled={savingPlatoId === plato.id}
                                >
                                  {savingPlatoId === plato.id ? 'Guardando...' : 'Guardar gramos'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserPlatosModal;
