import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

function ClientDashboard({ user, navigate }) {
  // Simulating data for visual impact as per mockups
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });
  const calories = 920;
  const goal = 2500;
  const progress = (calories / goal) * 100;

  return (
    <div className="animate-fade-in">
      {/* Daily Summary Section */}
      <div className="card mb-6 bg-gradient-to-r from-primary-50 to-white border-primary-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
           <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold font-heading capitalize mb-1">{today}</h2>
              <p className="text-secondary">Resumen de hoy</p>
           </div>
           
           <div className="flex items-center gap-8">
              <div className="text-center">
                 <div className="text-3xl font-extrabold text-primary-600">{calories}</div>
                 <div className="text-xs font-bold text-secondary uppercase tracking-wider">Kcal Consumidas</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-border"></div>
              <div className="text-center">
                 <div className="text-3xl font-extrabold text-secondary">{goal}</div>
                 <div className="text-xs font-bold text-secondary uppercase tracking-wider">Meta Diaria</div>
              </div>
           </div>

           <div className="w-full md:w-48">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                 <div style={{ width: `${progress}%` }} className="h-full bg-primary-500 rounded-full"></div>
              </div>
              <div className="text-right text-xs font-bold text-secondary mt-1">{Math.round(progress)}%</div>
           </div>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-1 md:grid-2 gap-6">
        
        {/* Meal Planner Access */}
        <div className="card p-0 overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-transparent" onClick={() => navigate('/planificador')}>
           <div className="h-2 bg-orange-400"></div>
           <div className="p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-3xl">
                 📅
              </div>
              <div>
                 <h3 className="text-lg font-bold">Mi Menú</h3>
                 <p className="text-secondary text-sm mb-3">Revisa y gestiona tus comidas del día.</p>
                 <span className="text-sm font-bold text-primary hover:underline">Ver Planificador →</span>
              </div>
           </div>
        </div>

        {/* Training Access */}
        <div className="card p-0 overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-transparent" onClick={() => navigate('/entrenamiento')}>
           <div className="h-2 bg-blue-500"></div>
           <div className="p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-3xl">
                 💪
              </div>
              <div>
                 <h3 className="text-lg font-bold">Entrenamiento</h3>
                 <p className="text-secondary text-sm mb-3">Accede a tus rutinas y registra tu progreso.</p>
                 <span className="text-sm font-bold text-blue-600 hover:underline">Ir a Entrenar →</span>
              </div>
           </div>
        </div>

      </div>

      <div className="grid grid-1 mt-4">
          <div className="card">
             <div className="card-header">
                <h3 className="card-title">🍽️ Comidas de Hoy</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/planificador')}>Ver semana complete</button>
             </div>
             
             <div className="grid grid-3">
                <div className="card" style={{ background: 'var(--bg-input)', border: 'none' }}>
                   <div className="badge badge-warning mb-4">Desayuno</div>
                   <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Avena con Frutas</h4>
                   <p className="text-secondary text-sm">Avena, Arándanos, Leche de Almendras</p>
                   <div className="flex items-center gap-2 mt-4 text-sm font-bold text-primary-600">
                      <span>🔥 350 Kcal</span>
                   </div>
                </div>

                <div className="card" style={{ background: 'var(--bg-input)', border: 'none' }}>
                   <div className="badge badge-warning mb-4">Almuerzo</div>
                   <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Ensalada César</h4>
                   <p className="text-secondary text-sm">Pollo, Lechuga, Queso Parmesano</p>
                   <div className="flex items-center gap-2 mt-4 text-sm font-bold text-primary-600">
                      <span>🔥 450 Kcal</span>
                   </div>
                </div>

                <div className="card" style={{ background: 'var(--bg-input)', border: 'none', opacity: 0.7 }}>
                   <div className="badge badge-warning mb-4">Cena</div>
                   <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Salmón al Horno</h4>
                   <p className="text-secondary text-sm">Salmón, Espárragos, Patata</p>
                   <div className="flex items-center gap-2 mt-4 text-sm font-bold text-primary-600">
                      <span>🔥 420 Kcal</span>
                   </div>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
}

import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths, isSameMonth, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

function AdminDashboard({ user, navigate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week'

  // Mock data for functionality
  const tasks = [
    { id: 1, type: 'confirmed', category: 'Videollamada', time: '14:00', duration: '1h', client: 'Alice Johnson' },
    { id: 2, type: 'pending', category: 'Llamada', time: '16:00', duration: '45m', client: 'Bob Smith' },
  ];

  const upcomingEvents = [
    { date: new Date().getDate() + 2, count: 3, type: 'Citas' },
    { date: new Date().getDate(), count: 1, type: 'Revision' },
  ];

  const handleDateClick = (day) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    if (isCurrentMonth || view === 'week') {
       navigate(`/planificador?date=${format(day, 'yyyy-MM-dd')}`);
    }
  };

  const nextPeriod = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const prevPeriod = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const days = [];
    let day = startDate;
    let formattedDate = "";

    // Generate days for the grid
    const calendarDays = eachDayOfInterval({
        start: view === 'month' ? startDate : startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: view === 'month' ? endDate : endOfWeek(currentDate, { weekStartsOn: 1 })
    });

    const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    return (
      <div className="card h-full min-h-[500px] flex flex-col p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2">
                <button 
                  onClick={() => setView('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'month' ? 'bg-primary text-white shadow-md' : 'bg-input text-secondary hover:bg-gray-100'}`}
                >
                  Mes
                </button>
                <button 
                  onClick={() => setView('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'week' ? 'bg-primary text-white shadow-md' : 'bg-input text-secondary hover:bg-gray-100'}`}
                >
                  Semana
                </button>
            </div>
            
            <div className="flex items-center gap-6">
                <button onClick={prevPeriod} className="btn-icon w-8 h-8 rounded-full hover:bg-gray-100">‹</button>
                <span className="font-bold text-xl text-main capitalize min-w-[150px] text-center">
                    {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'Semana del' d 'de' MMM", { locale: es })}
                </span>
                <button onClick={nextPeriod} className="btn-icon w-8 h-8 rounded-full hover:bg-gray-100">›</button>
            </div>

            <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-primary hover:underline">
                Hoy
            </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
            {weekDays.map(d => (
               <div key={d} className="text-center text-xs font-bold uppercase text-secondary tracking-wider opacity-60">{d}</div>
            ))}
        </div>
        
        {/* Calendar Grid - Minimalist */}
        <div className={`
            flex-1 grid grid-cols-7 
            ${view === 'month' ? 'auto-rows-fr gap-y-4' : 'h-full'}
        `}>
            {calendarDays.map((dayItem, i) => {
              const isCurrentMonth = isSameMonth(dayItem, monthStart);
              const isDayToday = isToday(dayItem);
              
              const dayEvents = upcomingEvents.find(e => e.date === dayItem.getDate() && isCurrentMonth);

              return (
                <div 
                  key={dayItem.toString()} 
                  onClick={() => handleDateClick(dayItem)}
                  className={`
                    flex flex-col items-center justify-start py-2 relative group rounded-xl transition-all cursor-pointer
                    ${!isCurrentMonth && view === 'month' ? 'opacity-20' : 'hover:bg-primary-50'}
                  `}
                >
                  <span className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mb-1 transition-all
                    ${isDayToday ? 'bg-primary text-white shadow-lg scale-110' : 'text-main group-hover:bg-white group-hover:shadow-sm'}
                  `}>
                    {format(dayItem, dateFormat)}
                  </span>

                  {/* Dot Indicators for Events */}
                  <div className="flex gap-1 h-2">
                    {dayEvents && (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            {dayEvents.count > 1 && <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>}
                        </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Calendar Column */}
        <div className="lg:col-span-2">
          {renderCalendar()}
        </div>

        {/* Side Panel - Summary */}
        <div className="flex flex-col gap-6">
          <div className="card bg-gradient-to-br from-white to-gray-50 border border-border/50 shadow-sm">
            <div className="card-header border-b border-border/50 pb-4 mb-4">
              <h3 className="card-title text-base font-bold flex items-center gap-2">
                <span>⚡</span> Pendientes
              </h3>
              <button className="btn btn-ghost btn-sm text-[10px]" onClick={() => navigate('/planificador')}>Ver Todo</button>
            </div>
            
            <div className="flex flex-col gap-4">
              {tasks.length > 0 ? tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl shadow-sm hover:border-primary transition-all cursor-pointer" onClick={() => navigate('/planificador')}>
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${task.type === 'confirmed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {task.category === 'Videollamada' ? '📹' : '📞'}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                         <span className="font-bold text-sm truncate">{task.client}</span>
                         <span className="text-[10px] font-bold text-secondary">{task.time}</span>
                      </div>
                      <div className="text-xs text-secondary truncate">{task.category} · {task.duration}</div>
                   </div>
                </div>
              )) : (
                  <p className="text-secondary text-center text-sm py-4">No hay pendientes urgentes.</p>
              )}
              
              <button className="btn btn-primary w-full mt-2" onClick={() => navigate('/planificador')}>
                Ir al Planificador
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const isAdmin = api.auth.isAdmin();
  const user = api.auth.getUser();

  return (
    <div>
      <header className="page-header flex justify-between items-center">
        <div>
            <h1 className="page-title">Hola, {user?.nombre?.split(' ')[0] || 'Usuario'} 👋</h1>
            <p className="page-subtitle">
            {isAdmin 
                ? 'Panel de control de NutriOrxata' 
                : 'Vamos a por tus objetivos de hoy.'}
            </p>
        </div>
        <div className="date-badge text-secondary font-medium">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </header>

      {isAdmin ? (
        <AdminDashboard user={user} navigate={navigate} />
      ) : (
        <ClientDashboard user={user} navigate={navigate} />
      )}
    </div>
  );
}
