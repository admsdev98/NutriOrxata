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

function AsignarPlatoModal({ onClose, onSave, dia, momento, platoActual, platos }) {
  const [selectedId, setSelectedId] = useState(platoActual?.cliente_plato_id || null);
  const [search, setSearch] = useState('');

  const disponibles = useMemo(() => {
    return platos.filter(p => {
      const momentos = Array.isArray(p.momentos_dia) && p.momentos_dia.length
        ? p.momentos_dia
        : (p.momento_dia ? [p.momento_dia] : []);
      return momentos.includes(momento);
    });
  }, [platos, momento]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return disponibles;
    return disponibles.filter(p => (p.plato_nombre || '').toLowerCase().includes(q));
  }, [disponibles, search]);

  const selectedPlato = useMemo(() => platos.find(p => p.id === selectedId) || null, [platos, selectedId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{DIAS_DISPLAY[dia]} · {MOMENTOS_DISPLAY[momento]}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">X</button>
        </div>

        <div className="modal-body custom-scrollbar">
          {disponibles.length === 0 ? (
            <div className="text-center" style={{ padding: '20px 0' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '6px' }}>Sin platos disponibles</div>
              <div className="text-secondary" style={{ fontSize: '0.95rem' }}>Asigna platos a este momento para poder planificar.</div>
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
                    borderColor: selectedId === null ? 'var(--primary-500)' : 'var(--border-color)',
                    background: selectedId === null ? 'var(--primary-50)' : 'var(--bg-card)'
                  }}
                  onClick={() => setSelectedId(null)}
                >
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>Sin asignar</div>
                  <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Vaciar este hueco.</div>
                </button>

                {filtered.map(plato => (
                  <button
                    key={plato.id}
                    type="button"
                    className="card"
                    style={{
                      padding: '14px',
                      textAlign: 'left',
                      borderColor: selectedId === plato.id ? 'var(--primary-500)' : 'var(--border-color)',
                      background: selectedId === plato.id ? 'var(--primary-50)' : 'var(--bg-card)'
                    }}
                    onClick={() => setSelectedId(plato.id)}
                  >
                    <div style={{ fontWeight: 800, marginBottom: '6px' }}>{plato.plato_nombre}</div>
                    <div className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-secondary">{Math.round(plato.calorias_totales)} kcal</span>
                      <span className="badge badge-secondary">{plato.peso_total_gramos} g</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {(selectedPlato || platoActual?.ingredientes?.length) && (
            <div className="card" style={{ background: 'var(--bg-input)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '10px' }}>Ingredientes</div>
              <div className="stack" style={{ display: 'grid', gap: '8px' }}>
                {(selectedPlato?.ingredientes || platoActual?.ingredientes || []).map(ing => (
                  <div key={ing.ingrediente_id} className="flex justify-between" style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
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
          <button type="button" className="btn btn-primary" onClick={() => onSave(selectedId)}>Guardar</button>
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
  const [semanaInicio, setSemanaInicio] = useState(() => getMonday());
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [viewMode, setViewMode] = useState(() => (window.innerWidth < 1100 ? 'day' : 'week'));
  const [selectedDay, setSelectedDay] = useState(() => dayKeyFromDate());

  useEffect(() => {
    if (isAdmin) {
      loadClientes();
      return;
    }
    if (user) {
      setSelectedClientId(user.id);
      setSelectedClient(user);
      setLoading(false);
    }
  }, [isAdmin]);

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

  async function loadClientes() {
    try {
      setLoading(true);
      const data = await api.auth.listUsers({ rol: 'cliente' });
      const items = data.items || [];
      setClientes(items);
      if (items.length > 0 && !selectedClientId) {
        setSelectedClientId(items[0].id);
        setSelectedClient(items[0]);
      } else if (selectedClientId) {
        setSelectedClient(items.find(c => c.id === selectedClientId) || null);
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

  async function handleSavePlanificacion(clientePlatoId) {
    try {
      await api.planificacion.create({
        semana_inicio: formatDate(semanaInicio),
        dia: modalData.dia,
        momento: modalData.momento,
        plato_id: null,
        cliente_plato_id: clientePlatoId,
        client_id: selectedClientId,
      });
      setModalData(null);
      loadResumen();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function handleClearMeal(dia, momento) {
    try {
      await api.planificacion.create({
        semana_inicio: formatDate(semanaInicio),
        dia,
        momento,
        plato_id: null,
        cliente_plato_id: null,
        client_id: selectedClientId,
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
          style={{ maxWidth: 780, marginLeft: 'auto', marginRight: 'auto' }}
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
                        <div style={{ fontWeight: 700, marginBottom: '2px' }}>{comida.plato_nombre}</div>
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
                                <div style={{ fontWeight: 800, marginBottom: '6px' }}>{comida.plato_nombre}</div>
                                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                  <span className="badge badge-primary">{Math.round(comida.calorias)} kcal</span>
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
          platos={clientPlatos}
          onClose={() => setModalData(null)}
          onSave={handleSavePlanificacion}
        />
      )}
    </div>
  );
}
