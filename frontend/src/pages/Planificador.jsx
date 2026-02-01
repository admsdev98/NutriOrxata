import { useState, useEffect, useRef } from 'react';
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

function getTodayDay() {
  const index = (new Date().getDay() + 6) % 7;
  return DIAS[index];
}

function CalorieBar({ total, objetivo }) {
  const safeObjetivo = objetivo && objetivo > 0 ? objetivo : 2000;
  const porcentaje = Math.min(100, Math.round((total / safeObjetivo) * 100));

  return (
    <div className="calorie-bar">
      <div className="calorie-bar-header">
        <span>{Math.round(total)} de {safeObjetivo} kcal</span>
        <span>{porcentaje}%</span>
      </div>
      <div className="calorie-bar-track">
        <div className="calorie-bar-fill" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

function AsignarPlatoModal({ onClose, onSave, dia, momento, platoActual, platos }) {
  const [selectedId, setSelectedId] = useState(platoActual?.cliente_plato_id || null);
  const [search, setSearch] = useState('');

  const disponibles = platos.filter(p => {
    const momentos = Array.isArray(p.momentos_dia) && p.momentos_dia.length
      ? p.momentos_dia
      : (p.momento_dia ? [p.momento_dia] : []);
    return momentos.includes(momento);
  });

  const filtered = disponibles.filter(p =>
    p.plato_nombre.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPlato = platos.find(p => p.id === selectedId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{DIAS_DISPLAY[dia]} · {MOMENTOS_DISPLAY[momento]}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {disponibles.length === 0 ? (
            <div className="empty-state compact">
              <div className="empty-state-title">Sin platos para este momento</div>
              <p className="text-muted">Asocia platos con este momento para poder planificar.</p>
            </div>
          ) : (
            <>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar plato..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <div className="list-compact">
                <button
                  className={`list-item ${selectedId === null ? 'active' : ''}`}
                  onClick={() => setSelectedId(null)}
                >
                  Sin asignar
                </button>
                {filtered.map(plato => (
                  <button
                    key={plato.id}
                    className={`list-item ${selectedId === plato.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(plato.id)}
                  >
                    <div className="list-item-title">{plato.plato_nombre}</div>
                    <div className="list-item-sub">{Math.round(plato.calorias_totales)} kcal · {plato.peso_total_gramos} g</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {(selectedPlato || platoActual?.ingredientes?.length) && (
            <div className="ingredients-preview">
              <div className="section-title">Ingredientes y gramos</div>
              <div className="stack">
                {(selectedPlato?.ingredientes || platoActual?.ingredientes || []).map(ing => (
                  <div key={ing.ingrediente_id} className="ingredient-row">
                    <span>{ing.ingrediente_nombre}</span>
                    <span className="text-muted">{ing.cantidad_gramos} g</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onSave(selectedId)}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function Planificador() {
  const [clientes, setClientes] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPlatos, setClientPlatos] = useState([]);
  const [semanaInicio, setSemanaInicio] = useState(getMonday());
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [viewMode, setViewMode] = useState(window.innerWidth < 900 ? 'day' : 'week');
  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const touchStartX = useRef(null);

  const isAdmin = api.auth.isAdmin();
  const user = api.auth.getUser();

  useEffect(() => {
    if (isAdmin) {
      loadClientes();
    } else if (user) {
      setSelectedClientId(user.id);
      setSelectedClient(user);
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 900 && viewMode === 'week') {
        setViewMode('day');
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  function setViewModeSafe(mode) {
    if (window.innerWidth < 900 && mode === 'week') {
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
      const data = await api.planificacion.resumen(
        selectedClientId,
        formatDate(semanaInicio)
      );
      setResumen(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function prevWeek() {
    const newDate = new Date(semanaInicio);
    newDate.setDate(newDate.getDate() - 7);
    setSemanaInicio(newDate);
  }

  function nextWeek() {
    const newDate = new Date(semanaInicio);
    newDate.setDate(newDate.getDate() + 7);
    setSemanaInicio(newDate);
  }

  function openModal(dia, momento) {
    const diaData = resumen?.dias?.find(d => d.dia === dia);
    const comida = diaData?.comidas?.find(c => c.momento === momento);
    setModalData({
      dia,
      momento,
      platoActual: comida || null,
    });
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
    if (deltaX > 0) {
      prevDay();
    } else {
      nextDay();
    }
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
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (isAdmin && clientes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👥</div>
        <h3 className="empty-state-title">No hay clientes</h3>
        <p>Añade usuarios con rol de cliente para poder planificar.</p>
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
    <div className="planner">
      <div className="card planner-toolbar">
        <div className="planner-controls">
          {isAdmin && (
            <div className="control-group planner-client">
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

          <div className="control-group planner-week">
            <label className="form-label">Semana</label>
            <div className="week-nav">
              <button className="btn btn-secondary btn-sm" onClick={prevWeek} aria-label="Semana anterior">←</button>
              <div className="week-range">
                <span className="week-range-title">Semana del</span>
                <span className="week-range-value">{formatWeekRange(semanaInicio)}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={nextWeek} aria-label="Semana siguiente">→</button>
            </div>
          </div>

          <div className="control-group planner-view">
            <label className="form-label">Vista</label>
            <div className="view-toggle">
              <button
                className={`btn btn-sm ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewModeSafe('day')}
              >
                Dia
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewModeSafe('week')}
              >
                Semana
              </button>
            </div>
          </div>

            {viewMode === 'day' && (
              <div className="control-group planner-day">
                <label className="form-label">Dia</label>
                <select
                  className="form-select"
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
              >
                {DIAS.map(dia => (
                  <option key={dia} value={dia}>{DIAS_DISPLAY[dia]}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'day' && currentDay && (
        <div className="day-view" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="day-card">
            <div className="day-header">
              <span>{DIAS_DISPLAY[selectedDay]}</span>
              <CalorieBar total={currentDay.calorias_totales} objetivo={dailyTarget} />
            </div>

            <div className="meal-list">
              {MOMENTOS.map(momento => {
                const comida = currentDay.comidas.find(c => c.momento === momento);
                return (
                  <div
                    key={momento}
                    className={`meal-slot ${!comida ? 'meal-slot-empty' : ''}`}
                    onClick={() => openModal(selectedDay, momento)}
                  >
                    <div className="meal-slot-header">
                      <span className="meal-moment">{MOMENTOS_DISPLAY[momento]}</span>
                      {comida && (
                        <button
                          className="icon-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearMeal(selectedDay, momento);
                          }}
                          aria-label="Quitar plato"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    {comida ? (
                      <div className="meal-body">
                        <div className="meal-name">{comida.plato_nombre}</div>
                        <div className="meal-calories">{Math.round(comida.calorias)} kcal</div>
                      </div>
                    ) : (
                      <div className="meal-body">
                        <div className="meal-empty">+ Anadir</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="week-grid">
          {DIAS.map(dia => {
            const diaData = resumen?.dias?.find(d => d.dia === dia) || {
              calorias_totales: 0,
              comidas: []
            };

            return (
              <div key={dia} className="day-card">
                <div className="day-header">
                  <span>{DIAS_DISPLAY[dia]}</span>
                  <CalorieBar total={diaData.calorias_totales} objetivo={dailyTarget} />
                </div>

                {MOMENTOS.map(momento => {
                  const comida = diaData.comidas.find(c => c.momento === momento);
                  return (
                    <div
                      key={momento}
                      className={`meal-slot ${!comida ? 'meal-slot-empty' : ''}`}
                      onClick={() => openModal(dia, momento)}
                    >
                      <div className="meal-slot-header">
                        <span className="meal-moment">{MOMENTOS_DISPLAY[momento]}</span>
                        {comida && (
                          <button
                            className="icon-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearMeal(dia, momento);
                            }}
                            aria-label="Quitar plato"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      {comida ? (
                        <div className="meal-body">
                          <div className="meal-name">{comida.plato_nombre}</div>
                          <div className="meal-calories">{Math.round(comida.calorias)} kcal</div>
                        </div>
                      ) : (
                        <div className="meal-body">
                          <div className="meal-empty">+ Anadir</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
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

export default Planificador;
