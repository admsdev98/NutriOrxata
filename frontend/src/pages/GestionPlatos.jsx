import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_DISPLAY = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo'
};
const MOMENTOS = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
const MOMENTOS_DISPLAY = {
  desayuno: { label: 'Desayuno' },
  almuerzo: { label: 'Almuerzo' },
  comida: { label: 'Comida' },
  merienda: { label: 'Merienda' },
  cena: { label: 'Cena' }
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
  return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
}

function getTodayDay() {
  const index = (new Date().getDay() + 6) % 7;
  return DIAS[index];
}

function CalorieBar({ total, objetivo }) {
  const safeObjetivo = objetivo && objetivo > 0 ? objetivo : 2000;
  const porcentaje = Math.min(100, Math.round((total / safeObjetivo) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-bold text-secondary mb-1">
        <span>{Math.round(total)} / {safeObjetivo} kcal</span>
        <span>{porcentaje}%</span>
      </div>
      <div className="h-1.5 bg-input rounded-full overflow-hidden">
        <div 
            className="h-full bg-primary transition-all duration-500 rounded-full" 
            style={{ width: `${porcentaje}%` }} 
        />
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
      <div className="modal modal-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="modal-header shrink-0">
          <h2 className="modal-title text-xl text-primary font-bold">
            {DIAS_DISPLAY[dia]} · {MOMENTOS_DISPLAY[momento].label}
          </h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body flex-1 overflow-y-auto custom-scrollbar">
          {disponibles.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="font-bold text-lg text-main">Sin platos disponibles</h3>
              <p className="text-secondary text-sm">No tienes platos asignados para este momento del día.</p>
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar plato..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <button
                  className={`p-3 rounded-lg border text-left transition-all ${selectedId === null ? 'border-primary bg-primary-50 ring-2 ring-primary-100' : 'border-border hover:bg-input'}`}
                  onClick={() => setSelectedId(null)}
                >
                  <span className="font-bold block">🚫 Sin asignar</span>
                  <span className="text-xs text-secondary">Limpiar este hueco</span>
                </button>
                
                {filtered.map(plato => (
                  <button
                    key={plato.id}
                    className={`p-3 rounded-lg border text-left transition-all ${selectedId === plato.id ? 'border-primary bg-primary-50 ring-2 ring-primary-100' : 'border-border hover:bg-input'}`}
                    onClick={() => setSelectedId(plato.id)}
                  >
                    <div className="font-bold text-main">{plato.plato_nombre}</div>
                    <div className="text-xs text-secondary mt-1 flex gap-2">
                        <span className="bg-white px-2 py-0.5 rounded border border-border">{Math.round(plato.calorias_totales)} kcal</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-border">{plato.peso_total_gramos}g</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {(selectedPlato || platoActual?.ingredientes?.length) && (
            <div className="bg-input rounded-xl p-4 border border-border">
              <h4 className="font-bold text-sm uppercase text-secondary mb-3">Ingredientes</h4>
              <div className="space-y-2">
                {(selectedPlato?.ingredientes || platoActual?.ingredientes || []).map(ing => (
                  <div key={ing.ingrediente_id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-border">
                    <span className="font-medium">{ing.ingrediente_nombre}</span>
                    <span className="text-secondary bg-input px-2 py-0.5 rounded text-xs">{ing.cantidad_gramos} g</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer shrink-0">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={() => onSave(selectedId)}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

function GestionPlatos() {
  const [clientes, setClientes] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPlatos, setClientPlatos] = useState([]);
  const [semanaInicio, setSemanaInicio] = useState(getMonday());
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [viewMode, setViewMode] = useState(window.innerWidth < 1100 ? 'day' : 'week');
  const [selectedDay, setSelectedDay] = useState(getTodayDay());
  const touchStartX = useRef(null);

  const isAdmin = api.auth.isAdmin();
  const user = api.auth.getUser();

  useEffect(() => {
    if (isAdmin) loadClientes();
    else if (user) {
      setSelectedClientId(user.id);
      setSelectedClient(user);
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100 && viewMode === 'week') setViewMode('day');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  function setViewModeSafe(mode) {
    if (window.innerWidth < 1100 && mode === 'week') { setViewMode('day'); return; }
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
      }
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  }

  async function loadClientPlatos() {
    try {
      const data = await api.clientesPlatos.list(selectedClientId);
      setClientPlatos(data);
    } catch (error) { setClientPlatos([]); }
  }

  async function loadResumen() {
    try {
      const data = await api.planificacion.resumen(selectedClientId, formatDate(semanaInicio));
      setResumen(data);
    } catch (error) { console.error('Error:', error); }
  }

  function prevWeek() {
    const d = new Date(semanaInicio); d.setDate(d.getDate() - 7); setSemanaInicio(d);
  }
  function nextWeek() {
    const d = new Date(semanaInicio); d.setDate(d.getDate() + 7); setSemanaInicio(d);
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

  function openModal(dia, momento) {
    const diaData = resumen?.dias?.find(d => d.dia === dia);
    const comida = diaData?.comidas?.find(c => c.momento === momento);
    setModalData({ dia, momento, platoActual: comida || null });
  }

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 40) return;
    deltaX > 0 ? prevDay() : nextDay();
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
    } catch (error) { alert('Error: ' + error.message); }
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
    } catch (error) { alert('Error: ' + error.message); }
  }

  if (loading) return <div className="spinner"></div>;

  const dailyTarget = selectedClient?.calorias_objetivo || 2000;
  const currentDay = resumen?.dias?.find(d => d.dia === selectedDay) || { dia: selectedDay, calorias_totales: 0, comidas: [] };

  return (
    <div className="animate-fade-in pb-8">
      {/* TOOLBAR */}
      <div className="card p-4 mb-6 sticky top-4 z-10 shadow-lg border-primary">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {isAdmin && (
            <div className="w-full md:w-auto">
              <label className="text-xs font-bold text-secondary uppercase mb-1 block">Cliente</label>
              <select 
                className="form-select w-full md:w-64"
                value={selectedClientId || ''}
                onChange={e => {
                  const id = parseInt(e.target.value, 10);
                  setSelectedClientId(id);
                  setSelectedClient(clientes.find(c => c.id === id));
                }}
              >
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center">
            <label className="text-xs font-bold text-secondary uppercase mb-1 block">Semana</label>
            <div className="flex items-center gap-2 bg-input rounded-lg p-1 border border-border">
                <button className="btn btn-icon w-8 h-8" onClick={prevWeek}>←</button>
                <div className="flex flex-col items-center px-4">
                  <span className="font-bold text-sm whitespace-nowrap">{formatWeekRange(semanaInicio)}</span>
                  <span className="text-[10px] text-secondary font-medium uppercase">Semana Actual</span>
                </div>
                <button className="btn btn-icon w-8 h-8" onClick={nextWeek}>→</button>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col items-end">
             <label className="text-xs font-bold text-secondary uppercase mb-1 block">Vista</label>
             <div className="flex bg-input rounded-lg p-1 border border-border">
                <button className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-main'}`} onClick={() => setViewModeSafe('day')}>Día</button>
                <button className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-main'}`} onClick={() => setViewModeSafe('week')}>Semana</button>
             </div>
          </div>
        </div>
      </div>

      {/* DAY NAVIGATION (Only in Day mode) */}
      {viewMode === 'day' && (
        <div className="flex justify-between items-center mb-4 md:hidden">
            <button className="btn btn-secondary btn-sm" onClick={prevDay}>← Anterior</button>
            <span className="font-bold capitalize">{DIAS_DISPLAY[selectedDay]}</span>
            <button className="btn btn-secondary btn-sm" onClick={nextDay}>Siguiente →</button>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="card max-w-2xl mx-auto" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black capitalize text-main">{DIAS_DISPLAY[selectedDay]}</h2>
                <div className="max-w-xs mx-auto mt-2">
                    <CalorieBar total={currentDay.calorias_totales} objetivo={dailyTarget} />
                </div>
            </div>

            <div className="space-y-3">
                {MOMENTOS.map(momento => {
                    const comida = currentDay.comidas.find(c => c.momento === momento);
                    return (
                        <div 
                            key={momento} 
                            onClick={() => openModal(selectedDay, momento)}
                            className={`
                                group relative p-5 rounded-xl border transition-all cursor-pointer overflow-hidden
                                ${comida ? 'bg-white border-primary shadow-sm hover:shadow-md' : 'bg-input border-dashed border-border hover:border-primary opacity-70 hover:opacity-100'}
                            `}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 text-secondary">
                                    {MOMENTOS_DISPLAY[momento].label}
                                </span>
                                {comida && (
                                    <span className="text-xs font-bold text-primary bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                                        {Math.round(comida.calorias)} kcal
                                    </span>
                                )}
                            </div>

                            {comida ? (
                                <div className="pr-8">
                                    <div className="font-bold text-lg text-main">{comida.plato_nombre}</div>
                                    <button 
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 text-red-500 rounded-full"
                                        onClick={(e) => { e.stopPropagation(); handleClearMeal(selectedDay, momento); }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-2 text-primary font-bold text-sm opacity-60 group-hover:opacity-100 flex items-center justify-center gap-2">
                                    <span className="text-lg">+</span> Añadir Plato
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* WEEK VIEW - Columnar Layout */}
      {viewMode === 'week' && (
          <div className="overflow-x-auto pb-6 custom-scrollbar">
              <div className="min-w-[1200px] grid grid-cols-7 gap-3">
                  {DIAS.map(dia => {
                      const diaData = resumen?.dias?.find(d => d.dia === dia) || { calorias_totales: 0, comidas: [] };
                      return (
                          <div key={dia} className="flex flex-col gap-2">
                              {/* Header */}
                              <div className="bg-white border border-border p-3 rounded-xl text-center shadow-sm">
                                  <div className="font-bold capitalize text-main mb-1">{DIAS_DISPLAY[dia]}</div>
                                  <CalorieBar total={diaData.calorias_totales} objetivo={dailyTarget} />
                              </div>
                              
                              {/* Slots styled as selectable inputs */}
                              <div className="flex-1 space-y-3">
                                  {MOMENTOS.map(momento => {
                                      const comida = diaData.comidas.find(c => c.momento === momento);
                                      return (
                                          <div key={momento} className="flex flex-col gap-1 flex-1">
                                              <label className="text-[10px] font-bold text-secondary uppercase flex items-center gap-1 pl-1">
                                                  {MOMENTOS_DISPLAY[momento].label}
                                              </label>
                                              
                                              <div 
                                                  onClick={() => openModal(dia, momento)}
                                                  className={`
                                                      min-h-[140px] p-3 rounded-lg border cursor-pointer transition-all relative group
                                                      flex flex-col
                                                      ${comida 
                                                          ? 'bg-white border-primary-300 shadow-sm border-2 ring-1 ring-primary-50' 
                                                          : 'bg-input border-dashed border border-border hover:border-primary-400 hover:bg-white hover:shadow-md'
                                                      }
                                                  `}
                                              >
                                                  {comida ? (
                                                      <>
                                                          <div className="font-bold text-xs text-main line-clamp-3 leading-snug mb-2">
                                                              {comida.plato_nombre}
                                                          </div>
                                                          <div className="mt-auto flex justify-between items-center">
                                                              <span className="text-[10px] font-black text-primary bg-primary-50 px-1.5 py-0.5 rounded-full">
                                                                  {Math.round(comida.calorias)} kcal
                                                              </span>
                                                              <button 
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error-50 text-error rounded transition-opacity"
                                                                onClick={(e) => { e.stopPropagation(); handleClearMeal(dia, momento); }}
                                                              >
                                                                  ✕
                                                              </button>
                                                          </div>
                                                      </>
                                                  ) : (
                                                      <div className="h-full flex items-center justify-center text-primary-300 text-2xl font-light opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">
                                                          +
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}

      {/* MODAL */}
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

export default GestionPlatos;
