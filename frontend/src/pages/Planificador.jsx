import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_DISPLAY = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miercoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sabado',
  domingo: 'Domingo'
};

const MOMENTOS = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
const MOMENTOS_DISPLAY = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  comida: 'Comida',
  merienda: 'Merienda',
  cena: 'Cena'
};

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatWeekRange(date) {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);

  const options = { day: 'numeric', month: 'short' };
  const startLabel = start.toLocaleDateString('es-ES', options);
  const endLabel = end.toLocaleDateString('es-ES', options);
  return `${startLabel} - ${endLabel}`;
}

function dayKeyFromDate(date = new Date()) {
  const index = (date.getDay() + 6) % 7;
  return DIAS[index];
}

function CalorieBar({ total, objetivo }) {
  const safeObjetivo = objetivo && objetivo > 0 ? objetivo : 2000;
  const porcentaje = Math.min(100, Math.round((total / safeObjetivo) * 100));

  return (
    <div>
      <div className="flex justify-between" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
        <span>{Math.round(total)} / {safeObjetivo} kcal</span>
        <span>{porcentaje}%</span>
      </div>
      <div style={{ height: '10px', background: 'var(--bg-input)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ width: `${porcentaje}%`, height: '100%', background: 'var(--primary-500)' }} />
      </div>
    </div>
  );
}

function roundToOneDecimal(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function EditarPlatoClienteModal({ clientId, plato, onClose, onSaved }) {
  const [localPlato, setLocalPlato] = useState(() => ({ ...plato }));
  const [targetKcal, setTargetKcal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalPlato({ ...plato });
    setTargetKcal('');
  }, [plato?.id]);

  function updateIngrediente(ingredienteId, value) {
    setLocalPlato(prev => ({
      ...prev,
      ingredientes: (prev.ingredientes || []).map(i =>
        i.ingrediente_id === ingredienteId
          ? { ...i, cantidad_gramos: value }
          : i
      )
    }));
  }

  function applyScaleToTargetKcal() {
    const target = parseFloat(targetKcal) || 0;
    const base = parseFloat(localPlato?.calorias_totales) || 0;
    if (!target || !base) return;
    const factor = target / base;
    setLocalPlato(prev => ({
      ...prev,
      ingredientes: (prev.ingredientes || []).map(i => ({
        ...i,
        cantidad_gramos: roundToOneDecimal((parseFloat(i.cantidad_gramos) || 0) * factor),
      }))
    }));
    setTargetKcal('');
  }

  async function save() {
    try {
      setSaving(true);
      await api.clientesPlatos.update(clientId, localPlato.id, {
        ingredientes: (localPlato.ingredientes || []).map(i => ({
          ingrediente_id: i.ingrediente_id,
          cantidad_gramos: parseFloat(i.cantidad_gramos) || 0,
        }))
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!localPlato) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar plato del cliente</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">X</button>
        </div>

        <div className="modal-body custom-scrollbar">
          <div className="card" style={{ marginBottom: '14px', background: 'var(--bg-card)' }}>
            <div style={{ fontWeight: 900, marginBottom: '6px' }}>{localPlato.plato_nombre}</div>
            <div className="text-secondary" style={{ fontSize: '0.9rem' }}>
              {Math.round(localPlato.calorias_totales || 0)} kcal · {Math.round(localPlato.peso_total_gramos || 0)} g
            </div>
          </div>

          <div className="card" style={{ marginBottom: '14px', background: 'var(--bg-input)' }}>
            <div style={{ fontWeight: 800, marginBottom: '8px' }}>Ajustar por kcal</div>
            <div className="flex" style={{ gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                className="form-input"
                style={{ maxWidth: 220 }}
                placeholder="Kcal objetivo (ej: 550)"
                value={targetKcal}
                onChange={e => setTargetKcal(e.target.value)}
              />
              <button type="button" className="btn btn-secondary" onClick={applyScaleToTargetKcal}>
                Aplicar
              </button>
            </div>
            <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              Escala proporcionalmente todos los ingredientes.
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-input)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '10px' }}>Ingredientes (g)</div>
            <div className="stack" style={{ display: 'grid', gap: '8px' }}>
              {(localPlato.ingredientes || []).map(ing => (
                <div key={ing.ingrediente_id} className="flex" style={{ justifyContent: 'space-between', gap: '12px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, minWidth: 0, flex: 1 }}>{ing.ingrediente_nombre}</div>
                  <div className="flex" style={{ gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 110, textAlign: 'right' }}
                      value={ing.cantidad_gramos}
                      onChange={e => updateIngrediente(ing.ingrediente_id, e.target.value)}
                    />
                    <span className="text-secondary" style={{ fontWeight: 800 }}>g</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AsignarPlatoModal({
  onClose,
  onSave,
  onEditClientePlato,
  onClientPlatosRefresh,
  clientId,
  dia,
  momento,
  platoActual,
  basePlatos,
  clientPlatos,
  isAdmin
}) {
  const initialClienteSelected = useMemo(() => {
    if (platoActual?.items?.length) {
      return platoActual.items
        .map(it => it?.cliente_plato_id)
        .filter(Boolean);
    }
    if (platoActual?.cliente_plato_id) return [platoActual.cliente_plato_id];
    return [];
  }, [platoActual]);

  const [libraryType, setLibraryType] = useState('client');
  const [selectedClienteIds, setSelectedClienteIds] = useState(initialClienteSelected);
  const [selectedBaseIds, setSelectedBaseIds] = useState([]);
  const [search, setSearch] = useState('');

  const [daysMode, setDaysMode] = useState('day');
  const [selectedDays, setSelectedDays] = useState(() => new Set([dia]));
  const [applyMode, setApplyMode] = useState('replace');

  function getMomentos(item) {
    if (!item) return [];
    const momentos = Array.isArray(item.momentos_dia) && item.momentos_dia.length
      ? item.momentos_dia
      : (item.momento_dia ? [item.momento_dia] : []);
    return momentos;
  }

  function getNombre(item) {
    return item?.plato_nombre || item?.nombre || '';
  }

  const libraryItems = useMemo(() => {
    const items = libraryType === 'base' ? (basePlatos || []) : (clientPlatos || []);
    return items.filter(p => getMomentos(p).includes(momento));
  }, [libraryType, basePlatos, clientPlatos, momento]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return libraryItems;
    return libraryItems.filter(p => getNombre(p).toLowerCase().includes(q));
  }, [libraryItems, search]);

  const selectedDiasFinal = useMemo(() => {
    if (!isAdmin || daysMode === 'day') return [dia];
    if (daysMode === 'week') return DIAS;
    return Array.from(selectedDays);
  }, [isAdmin, daysMode, dia, selectedDays]);

  function toggleDay(d) {
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      if (next.size === 0) next.add(dia);
      return next;
    });
  }

  function toggleSelectedId(id) {
    if (libraryType === 'base') {
      setSelectedBaseIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
      return;
    }
    setSelectedClienteIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  const selectedCount = libraryType === 'base' ? selectedBaseIds.length : selectedClienteIds.length;

  async function handleEditFromLibrary(item) {
    try {
      if (!clientId) return;
      if (libraryType === 'base') {
        // Create (or get) a cliente_plato from base template, then open editor.
        const created = await api.clientesPlatos.create(clientId, {
          plato_id: item.id,
          momentos_dia: [momento],
        });
        if (onClientPlatosRefresh) await onClientPlatosRefresh();
        if (created?.id) {
          setLibraryType('client');
          setSelectedClienteIds(prev => (prev.includes(created.id) ? prev : [...prev, created.id]));
          if (onEditClientePlato) onEditClientePlato(created.id);
        }
        return;
      }

      // libraryType === 'client'
      if (item?.id && onEditClientePlato) onEditClientePlato(item.id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{DIAS_DISPLAY[dia]} · {MOMENTOS_DISPLAY[momento]}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">X</button>
        </div>

        <div className="modal-body custom-scrollbar">
          {isAdmin && (
            <div className="card" style={{ padding: '12px 12px 10px', marginBottom: '14px', background: 'var(--bg-input)' }}>
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 800, marginBottom: '2px' }}>Aplicar</div>
                  <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    {daysMode === 'day' ? 'Solo a este dia.' : daysMode === 'week' ? 'A toda la semana.' : 'A los dias seleccionados.'}
                  </div>
                </div>

                <div className="flex" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{
                      border: 'none',
                      background: daysMode === 'day' ? 'var(--bg-card)' : 'transparent',
                      boxShadow: daysMode === 'day' ? 'var(--shadow-sm)' : 'none',
                      color: daysMode === 'day' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setDaysMode('day')}
                  >
                    Dia
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{
                      border: 'none',
                      background: daysMode === 'selected' ? 'var(--bg-card)' : 'transparent',
                      boxShadow: daysMode === 'selected' ? 'var(--shadow-sm)' : 'none',
                      color: daysMode === 'selected' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setDaysMode('selected')}
                  >
                    Varios
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{
                      border: 'none',
                      background: daysMode === 'week' ? 'var(--bg-card)' : 'transparent',
                      boxShadow: daysMode === 'week' ? 'var(--shadow-sm)' : 'none',
                      color: daysMode === 'week' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setDaysMode('week')}
                  >
                    Semana
                  </button>
                </div>
              </div>

              {daysMode === 'selected' && (
                <div style={{ marginTop: '10px' }}>
                  <div className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px' }}>Dias</div>
                  <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {DIAS.map(d => (
                      <button
                        key={d}
                        type="button"
                        className="btn btn-sm"
                        style={{
                          borderColor: selectedDays.has(d) ? 'var(--primary-500)' : 'var(--border-color)',
                          background: selectedDays.has(d) ? 'var(--primary-50)' : 'var(--bg-card)',
                          color: selectedDays.has(d) ? 'var(--accent-primary)' : 'var(--text-secondary)'
                        }}
                        onClick={() => toggleDay(d)}
                      >
                        {DIAS_DISPLAY[d]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                <div className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px' }}>Modo</div>
                <div className="flex" style={{ gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="flex" style={{ gap: '8px', alignItems: 'center', fontSize: '0.9rem' }}>
                    <input type="radio" name="applyMode" checked={applyMode === 'replace'} onChange={() => setApplyMode('replace')} />
                    <span><span style={{ fontWeight: 700 }}>Reemplazar</span><span className="text-secondary"> (deja solo estos)</span></span>
                  </label>
                  <label className="flex" style={{ gap: '8px', alignItems: 'center', fontSize: '0.9rem' }}>
                    <input type="radio" name="applyMode" checked={applyMode === 'add'} onChange={() => setApplyMode('add')} />
                    <span><span style={{ fontWeight: 700 }}>Anadir</span><span className="text-secondary"> (sumar a los actuales)</span></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '12px', marginBottom: '14px', background: 'var(--bg-card)' }}>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 800, marginBottom: '2px' }}>Seleccion de platos</div>
                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                  {selectedCount} seleccionados · se aplica a {selectedDiasFinal.length} dia(s)
                </div>
              </div>
              <div className="flex" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '4px' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    border: 'none',
                    background: libraryType === 'base' ? 'var(--bg-card)' : 'transparent',
                    boxShadow: libraryType === 'base' ? 'var(--shadow-sm)' : 'none',
                    color: libraryType === 'base' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setLibraryType('base')}
                >
                  Plantillas
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    border: 'none',
                    background: libraryType === 'client' ? 'var(--bg-card)' : 'transparent',
                    boxShadow: libraryType === 'client' ? 'var(--shadow-sm)' : 'none',
                    color: libraryType === 'client' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setLibraryType('client')}
                >
                  Del cliente
                </button>
              </div>
            </div>
          </div>

          {isAdmin && platoActual?.items?.length > 0 && (
            <div className="card" style={{ padding: '12px', marginBottom: '14px', background: 'var(--bg-input)' }}>
              <div style={{ fontWeight: 800, marginBottom: '8px' }}>Asignados en este hueco</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {platoActual.items.map((it, idx) => (
                  <div key={`${it.cliente_plato_id || 'x'}-${idx}`} className="flex" style={{ justifyContent: 'space-between', gap: '12px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>{it.plato_nombre}</div>
                      <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{Math.round(it.calorias || 0)} kcal</div>
                    </div>
                    {it.cliente_plato_id ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEditClientePlato && onEditClientePlato(it.cliente_plato_id)}
                      >
                        Editar
                      </button>
                    ) : (
                      <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 800 }}>Sin edicion</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {libraryItems.length === 0 ? (
            <div className="text-center" style={{ padding: '20px 0' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '6px' }}>Sin platos disponibles</div>
              <div className="text-secondary" style={{ fontSize: '0.95rem' }}>No hay platos para este momento.</div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Buscar</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar plato..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className="card"
                  style={{
                    padding: '14px',
                    textAlign: 'left',
                    borderColor: selectedCount === 0 ? 'var(--primary-500)' : 'var(--border-color)',
                    background: selectedCount === 0 ? 'var(--primary-50)' : 'var(--bg-card)'
                  }}
                  onClick={() => {
                    if (libraryType === 'base') setSelectedBaseIds([]);
                    else setSelectedClienteIds([]);
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>Sin asignar</div>
                  <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Vaciar este hueco.</div>
                </button>

                {filtered.map(plato => {
                  const id = plato.id;
                  const isChecked = libraryType === 'base'
                    ? selectedBaseIds.includes(id)
                    : selectedClienteIds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className="card"
                      style={{
                        padding: '14px',
                        textAlign: 'left',
                        borderColor: isChecked ? 'var(--primary-500)' : 'var(--border-color)',
                        background: isChecked ? 'var(--primary-50)' : 'var(--bg-card)'
                      }}
                      onClick={() => toggleSelectedId(id)}
                    >
                      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ fontWeight: 800, marginBottom: '6px' }}>{getNombre(plato)}</div>
                        <div className="flex" style={{ gap: '10px', alignItems: 'center' }}>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFromLibrary(plato);
                              }}
                            >
                              Editar
                            </button>
                          )}
                          <input type="checkbox" checked={isChecked} readOnly style={{ marginTop: '2px' }} />
                        </div>
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-secondary">{Math.round(plato.calorias_totales || 0)} kcal</span>
                        <span className="badge badge-secondary">{Math.round(plato.peso_total_gramos || 0)} g</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {libraryType === 'client' && (selectedClienteIds.length > 0 || platoActual?.items?.length) && (
            <div className="card" style={{ background: 'var(--bg-input)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '10px' }}>Ingredientes</div>
              <div className="stack" style={{ display: 'grid', gap: '8px' }}>
                {(() => {
                  const source = selectedClienteIds.length
                    ? (clientPlatos || []).filter(p => selectedClienteIds.includes(p.id))
                    : (platoActual?.items || []);
                  const ingredients = [];
                  source.forEach(p => (p.ingredientes || []).forEach(ing => ingredients.push(ing)));
                  return ingredients;
                })().map((ing, idx) => (
                  <div key={`${ing.ingrediente_id}-${idx}`} className="flex justify-between" style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 600 }}>{ing.ingrediente_nombre}</span>
                    <span className="text-secondary" style={{ fontWeight: 700 }}>{ing.cantidad_gramos} g</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSave({
              dias: selectedDiasFinal,
              mode: isAdmin ? applyMode : 'replace',
              basePlatoIds: libraryType === 'base' ? selectedBaseIds : [],
              clientePlatoIds: libraryType === 'client' ? selectedClienteIds : [],
            })}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Planificador() {
  const [searchParams] = useSearchParams();
  const touchStartX = useRef(null);

  const isAdmin = api.auth.isAdmin();
  const user = api.auth.getUser();

  const [clientes, setClientes] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPlatos, setClientPlatos] = useState([]);
  const [basePlatos, setBasePlatos] = useState([]);
  const [semanaInicio, setSemanaInicio] = useState(() => getMonday());
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [editClientePlato, setEditClientePlato] = useState(null);
  const [viewMode, setViewMode] = useState(() => (window.innerWidth < 1100 ? 'day' : 'week'));
  const [selectedDay, setSelectedDay] = useState(() => dayKeyFromDate());

  const clientIdParam = useMemo(() => {
    if (!isAdmin) return null;
    const value = searchParams.get('clientId');
    if (!value) return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadClientes(clientIdParam);
      return;
    }
    if (user) {
      setSelectedClientId(user.id);
      setSelectedClient(user);
      setLoading(false);
    }
  }, [isAdmin, clientIdParam]);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam) return;
    const d = new Date(dateParam);
    if (Number.isNaN(d.getTime())) return;
    setSemanaInicio(getMonday(d));
    setSelectedDay(dayKeyFromDate(d));
  }, [searchParams]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1100 && viewMode === 'week') {
        setViewMode('day');
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  function setViewModeSafe(mode) {
    if (window.innerWidth < 1100 && mode === 'week') {
      setViewMode('day');
      return;
    }
    setViewMode(mode);
  }

  useEffect(() => {
    if (selectedClientId) {
      loadResumen();
      loadClientPlatos();
    }
  }, [selectedClientId, semanaInicio]);

  useEffect(() => {
    loadBasePlatos();
  }, []);

  async function loadBasePlatos() {
    try {
      const data = await api.platos.list();
      setBasePlatos(data?.items || data || []);
    } catch (error) {
      console.error('Error:', error);
      setBasePlatos([]);
    }
  }

  async function loadClientes(preferredClientId = null) {
    try {
      setLoading(true);
      const data = await api.auth.listUsers({ rol: 'cliente' });
      const items = data.items || [];
      setClientes(items);
      if (items.length > 0) {
        const preferredId = preferredClientId || selectedClientId;
        const nextClient = preferredId
          ? items.find(c => c.id === preferredId) || items[0]
          : items[0];
        setSelectedClientId(nextClient.id);
        setSelectedClient(nextClient);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadClientPlatos() {
    try {
      const data = await api.clientesPlatos.list(selectedClientId);
      setClientPlatos(data);
    } catch (error) {
      console.error('Error:', error);
      setClientPlatos([]);
    }
  }

  function openEditClientePlato(clientePlatoId) {
    const found = (clientPlatos || []).find(p => p.id === clientePlatoId);
    if (!found) {
      alert('No se encontro el plato del cliente. Recarga la pagina e intentalo de nuevo.');
      return;
    }
    setEditClientePlato(found);
  }

  async function loadResumen() {
    try {
      const data = await api.planificacion.resumen(selectedClientId, formatDate(semanaInicio));
      setResumen(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function prevWeek() {
    const d = new Date(semanaInicio);
    d.setDate(d.getDate() - 7);
    setSemanaInicio(d);
  }

  function nextWeek() {
    const d = new Date(semanaInicio);
    d.setDate(d.getDate() + 7);
    setSemanaInicio(d);
  }

  function openModal(dia, momento) {
    const diaData = resumen?.dias?.find(d => d.dia === dia);
    const comida = diaData?.comidas?.find(c => c.momento === momento);
    setModalData({ dia, momento, platoActual: comida || null });
  }

  function prevDay() {
    const index = DIAS.indexOf(selectedDay);
    const nextIndex = (index - 1 + DIAS.length) % DIAS.length;
    setSelectedDay(DIAS[nextIndex]);
  }

  function nextDay() {
    const index = DIAS.indexOf(selectedDay);
    const nextIndex = (index + 1) % DIAS.length;
    setSelectedDay(DIAS[nextIndex]);
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0].clientX;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 40) return;
    if (deltaX > 0) prevDay();
    else nextDay();
  }

  async function handleSavePlanificacion({ basePlatoIds, clientePlatoIds, dias, mode }) {
    try {
      const semana = formatDate(semanaInicio);
      const momento = modalData.momento;

      await api.planificacion.bulk({
        semana_inicio: semana,
        client_id: selectedClientId,
        momento,
        dias: dias && dias.length ? dias : [modalData.dia],
        base_plato_ids: basePlatoIds && basePlatoIds.length ? basePlatoIds : undefined,
        cliente_plato_ids: clientePlatoIds && clientePlatoIds.length ? clientePlatoIds : [],
        mode: mode || 'replace',
      });
      setModalData(null);
      loadResumen();
      loadClientPlatos();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function handleClearMeal(dia, momento) {
    try {
      await api.planificacion.bulk({
        semana_inicio: formatDate(semanaInicio),
        client_id: selectedClientId,
        momento,
        dias: [dia],
        cliente_plato_ids: [],
        mode: 'replace',
      });
      loadResumen();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (isAdmin && clientes.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3 className="card-title">No hay clientes</h3>
        <p className="text-secondary">Crea usuarios con rol de cliente para poder planificar.</p>
      </div>
    );
  }

  const dailyTarget = selectedClient?.calorias_objetivo || selectedClient?.calorias_mantenimiento || 2000;
  const currentDay = resumen?.dias?.find(d => d.dia === selectedDay) || {
    dia: selectedDay,
    calorias_totales: 0,
    comidas: [],
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '24px' }}>
      <div className="card" style={{ padding: '14px', marginBottom: '18px' }}>
        <div className="flex flex-col md:flex-row" style={{ gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '4px' }}>Planificador</div>
            <div className="text-secondary" style={{ fontSize: '0.95rem' }}>
              {isAdmin ? 'Gestiona el plan semanal del cliente.' : 'Consulta tu plan semanal.'}
            </div>
          </div>

          {isAdmin && (
            <div style={{ minWidth: 260, width: '100%' }}>
              <label className="form-label">Cliente</label>
              <select
                className="form-select"
                value={selectedClientId || ''}
                onChange={e => {
                  const id = parseInt(e.target.value, 10);
                  setSelectedClientId(id);
                  setSelectedClient(clientes.find(c => c.id === id) || null);
                }}
              >
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ width: '100%', maxWidth: 420 }}>
            <label className="form-label">Semana</label>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={prevWeek}>Anterior</button>
              <div className="card" style={{ flex: 1, padding: '10px 12px', textAlign: 'center', boxShadow: 'none' }}>
                <div style={{ fontWeight: 800 }}>{formatWeekRange(semanaInicio)}</div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={nextWeek}>Siguiente</button>
            </div>
          </div>

          <div style={{ minWidth: 220, width: '100%' }}>
            <label className="form-label">Vista</label>
            <div className="flex" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '4px' }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  flex: 1,
                  border: 'none',
                  background: viewMode === 'day' ? 'var(--bg-card)' : 'transparent',
                  boxShadow: viewMode === 'day' ? 'var(--shadow-sm)' : 'none',
                  color: viewMode === 'day' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setViewModeSafe('day')}
              >
                Dia
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  flex: 1,
                  border: 'none',
                  background: viewMode === 'week' ? 'var(--bg-card)' : 'transparent',
                  boxShadow: viewMode === 'week' ? 'var(--shadow-sm)' : 'none',
                  color: viewMode === 'week' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setViewModeSafe('week')}
              >
                Semana
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'day' && (
        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={prevDay}>Anterior</button>
          <div style={{ fontWeight: 900, textTransform: 'capitalize' }}>{DIAS_DISPLAY[selectedDay]}</div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={nextDay}>Siguiente</button>
        </div>
      )}

      {viewMode === 'day' && (
        <div
          className="card"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ width: '100%' }}
        >
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: '8px', textTransform: 'capitalize' }}>{DIAS_DISPLAY[selectedDay]}</div>
            <CalorieBar total={currentDay.calorias_totales} objetivo={dailyTarget} />
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {MOMENTOS.map(momento => {
              const comida = currentDay.comidas.find(c => c.momento === momento);
              return (
                <button
                  key={momento}
                  type="button"
                  className="card"
                  onClick={() => openModal(selectedDay, momento)}
                  style={{
                    padding: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderStyle: comida ? 'solid' : 'dashed',
                    background: comida ? 'var(--bg-card)' : 'var(--bg-input)'
                  }}
                >
                  <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 900 }}>{MOMENTOS_DISPLAY[momento]}</div>
                    {comida ? (
                      <div className="badge badge-primary">{Math.round(comida.calorias)} kcal</div>
                    ) : (
                      <div className="badge badge-secondary">Sin asignar</div>
                    )}
                  </div>

                  {comida ? (
                    <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                          {(() => {
                            const items = comida.items || [];
                            if (items.length === 0) return comida.plato_nombre;
                            const first = items[0]?.plato_nombre || 'Plato';
                            return items.length > 1 ? `${first} +${items.length - 1}` : first;
                          })()}
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.9rem' }}>Click para cambiar</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearMeal(selectedDay, momento);
                        }}
                        style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--accent-error)' }}
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="text-secondary" style={{ fontSize: '0.9rem' }}>Click para asignar un plato.</div>
                  )}

                  {isAdmin && comida?.items?.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                      {comida.items.slice(0, 2).map((it, idx) => (
                        <button
                          key={`${it.cliente_plato_id || 'x'}-${idx}`}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (it.cliente_plato_id) openEditClientePlato(it.cliente_plato_id);
                          }}
                        >
                          Editar: {it.plato_nombre}
                        </button>
                      ))}
                      {comida.items.length > 2 && (
                        <div className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                          +{comida.items.length - 2} mas (edita desde Platos del cliente si lo necesitas)
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="custom-scrollbar" style={{ overflowX: 'auto', padding: '16px' }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(220px, 1fr))', gap: '12px', minWidth: 1100 }}>
              {DIAS.map(dia => {
                const diaData = resumen?.dias?.find(d => d.dia === dia) || { calorias_totales: 0, comidas: [] };
                return (
                  <div key={dia} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="card" style={{ padding: '12px', boxShadow: 'none', background: 'var(--bg-card)' }}>
                      <div style={{ fontWeight: 900, textTransform: 'capitalize', marginBottom: '8px' }}>{DIAS_DISPLAY[dia]}</div>
                      <CalorieBar total={diaData.calorias_totales} objetivo={dailyTarget} />
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                      {MOMENTOS.map(momento => {
                        const comida = diaData.comidas.find(c => c.momento === momento);
                        return (
                          <button
                            key={momento}
                            type="button"
                            className="card"
                            onClick={() => openModal(dia, momento)}
                            style={{
                              padding: '12px',
                              textAlign: 'left',
                              borderStyle: comida ? 'solid' : 'dashed',
                              background: comida ? 'var(--bg-card)' : 'var(--bg-input)',
                              boxShadow: 'none'
                            }}
                          >
                            <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                              {MOMENTOS_DISPLAY[momento]}
                            </div>

                            {comida ? (
                              <>
                                <div style={{ fontWeight: 800, marginBottom: '6px' }}>
                                  {(() => {
                                    const items = comida.items || [];
                                    if (items.length === 0) return comida.plato_nombre;
                                    const first = items[0]?.plato_nombre || 'Plato';
                                    return items.length > 1 ? `${first} +${items.length - 1}` : first;
                                  })()}
                                </div>
                                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                  <span className="badge badge-primary">{Math.round(comida.calorias)} kcal</span>
                                  <div className="flex" style={{ gap: '8px', alignItems: 'center' }}>
                                    {isAdmin && comida.items?.length === 1 && comida.items[0]?.cliente_plato_id && (
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditClientePlato(comida.items[0].cliente_plato_id);
                                        }}
                                      >
                                        Editar
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearMeal(dia, momento);
                                      }}
                                      style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--accent-error)' }}
                                    >
                                      Quitar
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Sin asignar</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {modalData && (
        <AsignarPlatoModal
          dia={modalData.dia}
          momento={modalData.momento}
          platoActual={modalData.platoActual}
          basePlatos={basePlatos}
          clientPlatos={clientPlatos}
          isAdmin={isAdmin}
          clientId={selectedClientId}
          onClose={() => setModalData(null)}
          onSave={handleSavePlanificacion}
          onEditClientePlato={(clientePlatoId) => openEditClientePlato(clientePlatoId)}
          onClientPlatosRefresh={loadClientPlatos}
        />
      )}

      {isAdmin && editClientePlato && (
        <EditarPlatoClienteModal
          clientId={selectedClientId}
          plato={editClientePlato}
          onClose={() => setEditClientePlato(null)}
          onSaved={() => {
            loadClientPlatos();
            loadResumen();
          }}
        />
      )}
    </div>
  );
}
