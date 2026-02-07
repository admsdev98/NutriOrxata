import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

function generateMonthSummaries(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const labels = [
    { label: 'Tarea X', color: 'var(--accent-info)' },
    { label: 'Seguimiento', color: 'var(--accent-success)' },
    { label: 'Revisar progreso', color: 'var(--accent-warning)' },
    { label: 'Actualizar plan', color: 'var(--accent-primary)' },
    { label: 'Nota interna', color: 'var(--accent-error)' }
  ];

  const summaries = {};
  const d = new Date(first);
  while (d <= last) {
    const key = formatDate(d);
    const citas = Math.random() > 0.4 ? Math.floor(Math.random() * 4) : 0;
    const llamadas = Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0;
    const videollamadas = Math.random() > 0.6 ? Math.floor(Math.random() * 2) : 0;
    const notas = Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0;

    const taskCount = Math.random() > 0.45 ? Math.floor(Math.random() * 3) : 0;
    const tareas = Array.from({ length: taskCount }, () => {
      const pick = labels[Math.floor(Math.random() * labels.length)];
      return { label: pick.label, color: pick.color };
    });

    summaries[key] = {
      llamadas,
      videollamadas,
      citas,
      notas,
      tareas,
      resumen: 'Actividad del dia'
    };
    d.setDate(d.getDate() + 1);
  }

  return summaries;
}

const RESUMEN_POR_FECHA = generateMonthSummaries();

function startOfWeek(date) {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaySummary(date) {
  const key = formatDate(date);
  return RESUMEN_POR_FECHA[key] || {
    llamadas: 0,
    videollamadas: 0,
    citas: 0,
    notas: 0,
    tareas: [],
    resumen: 'Sin actividad registrada'
  };
}

function AdminCalendar({ onPickDate, mensajesRecientes }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const todayKey = formatDate(new Date());

  const monthDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const start = new Date(first);
    const weekday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - weekday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(last);
    const weekdayEnd = (end.getDay() + 6) % 7;
    end.setDate(end.getDate() + (6 - weekdayEnd));
    end.setHours(0, 0, 0, 0);

    const out = [];
    const d = new Date(start);
    while (d <= end) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return { days: out, month };
  }, [cursor]);

  function pickDate(d) {
    setSelectedDate(d);
    setCursor(d);
    onPickDate(d);
  }

  function prev() {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() - 1);
    setCursor(d);
    setSelectedDate(d);
  }

  function next() {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + 1);
    setCursor(d);
    setSelectedDate(d);
  }

  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long' });
  const yearLabel = cursor.getFullYear();
  
  const dateInputRef = useRef(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start h-full">
      {/* LEFT: Calendar Main Area */}
      <div className="card p-6 h-full flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-center sm:justify-start gap-4 mb-8">
           <div className="flex items-center gap-3 relative group">
               {/* Hidden Date Input for Picker */}
               <input 
                  ref={dateInputRef}
                  type="date" 
                  className="absolute opacity-0 pointer-events-none"
                  style={{ top: '100%', left: 0 }}
                  onChange={(e) => {
                      if(e.target.valueAsDate) {
                          pickDate(e.target.valueAsDate);
                      }
                  }}
               />

               {/* Month */}
               <span 
                 onClick={() => dateInputRef.current?.showPicker()}
                 className="text-3xl font-black capitalize text-main cursor-pointer hover:text-primary-600 transition-colors select-none"
               >
                 {monthLabel}
               </span>

               {/* Navigation Arrows */}
               <div className="flex items-center gap-1">
                 <button 
                    onClick={(e) => { e.stopPropagation(); prev(); }} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-input hover:bg-white hover:shadow-md border border-transparent hover:border-border-color transition-all text-secondary hover:text-primary-600"
                 >
                   &lt;
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); next(); }} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-input hover:bg-white hover:shadow-md border border-transparent hover:border-border-color transition-all text-secondary hover:text-primary-600"
                 >
                   &gt;
                 </button>
               </div>

               {/* Year */}
               <span 
                 onClick={() => dateInputRef.current?.showPicker()}
                 className="text-3xl font-light text-secondary cursor-pointer hover:text-primary-600 transition-colors select-none"
               >
                 {yearLabel}
               </span>
           </div>
        </div>

        {/* Calendar Grid - Month View Only */}
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-7 mb-4">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((d, i) => (
              <div key={d} className={`text-center text-xs font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-orange-600 opacity-80' : 'text-secondary'}`}>
                {d}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 grid-rows-5 gap-3 flex-1">
            {monthDays.days.map((d, idx) => {
              const inMonth = d.getMonth() === monthDays.month;
              const key = formatDate(d);
              const isToday = key === todayKey;
              const isSelected = key === formatDate(selectedDate);
              const daySummary = getDaySummary(d);
              const hasActivity = (daySummary.llamadas + daySummary.videollamadas + daySummary.citas + daySummary.notas + daySummary.tareas.length) > 0;

              return (
                <button
                  key={key}
                  onClick={() => pickDate(d)}
                  className={`
                    relative p-3 rounded-2xl text-left transition-all border
                    flex flex-col justify-between min-h-[100px]
                    ${isToday ? 'bg-primary-50 border-primary-200' : 'bg-white hover:border-primary-300 border-transparent hover:shadow-md'}
                    ${isSelected && !isToday ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                    ${!inMonth ? 'opacity-40 bg-gray-50' : ''}
                  `}
                >
                   <div className="flex justify-between items-start w-full">
                     <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary-500 text-white shadow-primary' : 'text-main'}`}>
                       {d.getDate()}
                     </span>
                   </div>

                   <div className="mt-2 space-y-1">
                      {daySummary.citas > 0 && (
                        <div className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-md truncate shadow-sm">
                          {daySummary.citas} Cita{daySummary.citas > 1 ? 's' : ''}
                        </div>
                      )}
                      {(daySummary.llamadas + daySummary.videollamadas) > 0 && (
                         <div className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-md truncate shadow-sm">
                           {daySummary.llamadas + daySummary.videollamadas} Llamada{daySummary.llamadas + daySummary.videollamadas > 1 ? 's' : ''}
                         </div>
                      )}
                      {daySummary.tareas.slice(0, 1).map((t, i) => (
                         <div key={i} className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-md truncate shadow-sm">
                           {t.label}
                         </div>
                      ))}
                   </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Notifications & Schedule Panel */}
      <div className="flex flex-col gap-6 h-full">
         
         {/* Notifications / Messages */}
         <div className="card p-5 flex-1 h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg text-main">Notificaciones</h3>
               <button className="btn-icon w-8 h-8 bg-bg-app hover:bg-gray-200 rounded-full">
                  <span className="text-lg">+</span>
               </button>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
               {mensajesRecientes.length > 0 ? mensajesRecientes.map((m) => (
                  <div key={m.id} className="flex gap-4 items-start p-3 hover:bg-bg-hover rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-border-color">
                     <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${m.id % 2 === 0 ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                           <div className="font-bold text-sm text-main truncate pr-2">{m.titulo}</div>
                           <span className="text-[10px] text-secondary bg-bg-app px-1.5 py-0.5 rounded border">{m.fecha}</span>
                        </div>
                        <div className="text-xs text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                           {m.detalle}
                        </div>
                     </div>
                  </div>
               )) : (
                  <div className="text-center py-10 text-secondary text-sm">No hay mensajes recientes</div>
               )}
            </div>

            <div className="mt-4 pt-4 border-t border-border-color shrink-0">
               <h4 className="font-bold text-sm text-secondary mb-3 uppercase tracking-wide">Categorias</h4>
               <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm font-medium text-main p-2 hover:bg-bg-input rounded-lg cursor-pointer">
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                     Trabajo
                     <span className="ml-auto text-xs text-secondary bg-gray-100 px-2 py-0.5 rounded-full">12</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-main p-2 hover:bg-bg-input rounded-lg cursor-pointer">
                     <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                     Personal
                     <span className="ml-auto text-xs text-secondary bg-gray-100 px-2 py-0.5 rounded-full">5</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-main p-2 hover:bg-bg-input rounded-lg cursor-pointer">
                     <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                     Importante
                     <span className="ml-auto text-xs text-secondary bg-gray-100 px-2 py-0.5 rounded-full">2</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const mensajesRecientes = [
    { id: 1, titulo: 'Nueva consulta', detalle: 'Cliente pregunta por ajustes del plan semanal.', fecha: 'Hoy' },
    { id: 2, titulo: 'Nota interna', detalle: 'Revisar seguimiento de progreso de Ana.', fecha: 'Ayer' },
    { id: 3, titulo: 'Recordatorio', detalle: 'Enviar resumen mensual a los clientes.', fecha: 'Hace 2 dias' },
    { id: 4, titulo: 'Sistema', detalle: 'Actualizacion programada para el viernes.', fecha: 'Jueves' }
  ];

  return (
    <div className="animate-fade-in w-full">
      <AdminCalendar
        onPickDate={(d) => window.open(`/planificador-trabajo?date=${formatDate(d)}`, '_blank', 'noopener,noreferrer')}
        mensajesRecientes={mensajesRecientes}
      />
    </div>
  );
}

function ClientDashboard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    load();
  }, [user?.id]);

  async function load() {
    if (!user?.id) return;
    try {
      setLoading(true);
      const semanaInicio = getMonday(new Date());
      const data = await api.planificacion.resumen(user.id, formatDate(semanaInicio));
      setResumen(data);
    } catch (error) {
      console.error('Error loading client dashboard:', error);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();
  const dayKey = dayKeyFromDate(today);
  const dayData = resumen?.dias?.find(d => d.dia === dayKey) || { calorias_totales: 0, comidas: [] };
  const dailyTarget = user?.calorias_objetivo || user?.calorias_mantenimiento || 2000;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gap: '16px' }}>
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--bg-card) 60%)',
          borderColor: 'rgba(249, 115, 22, 0.25)'
        }}
      >
        <div className="flex flex-col md:flex-row" style={{ gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.25rem', textTransform: 'capitalize' }}>
              {today.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="text-secondary">Resumen de hoy</div>
          </div>

          <div style={{ width: '100%', maxWidth: 420 }}>
            <CalorieBar total={dayData.calorias_totales} objetivo={dailyTarget} />
          </div>

          <div className="flex" style={{ gap: '10px' }}>
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/plan-nutricional?date=${formatDate(today)}`)}>
              Abrir plan
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/entrenamiento')}>
              Entrenamiento
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Comidas de hoy</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/plan-nutricional?date=${formatDate(today)}`)}>
            Ver planificador
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOMENTOS.map(momento => {
            const comida = dayData.comidas.find(c => c.momento === momento);
            return (
              <div key={momento} className="card" style={{ background: 'var(--bg-input)', boxShadow: 'none' }}>
                <div className="badge badge-secondary" style={{ marginBottom: '10px' }}>{MOMENTOS_DISPLAY[momento]}</div>
                {comida ? (
                  <>
                    <div style={{ fontWeight: 900, marginBottom: '6px' }}>{comida.plato_nombre}</div>
                    <div className="text-secondary" style={{ fontWeight: 800 }}>{Math.round(comida.calorias)} kcal</div>
                  </>
                ) : (
                  <div className="text-secondary">Sin asignar</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const isAdmin = api.auth.isAdmin();
  const user = api.auth.getUser();

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Hola, {user?.nombre?.split(' ')[0] || 'Usuario'}</h1>
          <p className="page-subtitle">{isAdmin ? 'Panel de control' : 'Tu resumen diario'}</p>
        </div>
      </header>

      {isAdmin ? <AdminDashboard /> : <ClientDashboard user={user} />}
    </div>
  );
}
