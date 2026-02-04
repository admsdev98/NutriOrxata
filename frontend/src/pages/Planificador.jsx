import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, 
  addWeeks, subWeeks, isSameDay, isToday, startOfDay, addHours, setHours, setMinutes 
} from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../api/client';

// --- ADMIN COMPONENT (Original Event Scheduler) ---
function AdminPlanner({ currentDate, view, setView, changeDate, goToToday }) {
  const [events, setEvents] = useState([
    { id: 1, title: 'Reunión Equipó', start: setHours(currentDate, 9), end: setHours(currentDate, 10), type: 'work' },
    { id: 2, title: 'Comida Cliente', start: setHours(currentDate, 13), end: setHours(currentDate, 14), type: 'meeting' },
    { id: 3, title: 'Revisión Dietas', start: setHours(currentDate, 16), duration: 2, end: setHours(currentDate, 18), type: 'task' },
  ]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate, { weekStartsOn: 1 })
  });

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

  const handleSlotClick = (day, hour) => {
      const newEventStart = setMinutes(setHours(day, hour), 0);
      const newEventEnd = addHours(newEventStart, 1);
      
      const title = prompt("Nuevo Evento:");
      if (title) {
          setEvents([...events, {
              id: Date.now(),
              title,
              start: newEventStart,
              end: newEventEnd,
              type: 'general'
          }]);
      }
  };

  const renderEvent = (event, isWeekView = false) => {
      return (
          <div 
            key={event.id}
            className={`
                absolute rounded-md p-2 text-xs font-bold shadow-sm overflow-hidden cursor-pointer hover:brightness-95 transition-all
                ${event.type === 'work' ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' : ''}
                ${event.type === 'meeting' ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-500' : ''}
                ${event.type === 'task' ? 'bg-green-100 text-green-700 border-l-4 border-green-500' : ''}
                ${event.type === 'general' ? 'bg-gray-100 text-gray-700 border-l-4 border-gray-500' : ''}
            `}
            style={{
                top: isWeekView 
                    ? `${(event.start.getHours() - 8) * 60}px` 
                    : `${(event.start.getHours() - 8) * 80 + event.start.getMinutes() * (80/60)}px`,
                height: isWeekView
                    ? `${(event.end.getHours() - event.start.getHours()) * 60}px`
                    : `${(event.end - event.start) / (1000 * 60 * 60) * 80}px`,
                width: 'calc(100% - 10px)',
                left: '5px'
            }}
            onClick={(e) => { e.stopPropagation(); alert(`Editar: ${event.title}`); }}
          >
              <div className="truncate">{event.title}</div>
              <div className="text-[10px] opacity-80">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</div>
          </div>
      );
  };

  return (
      <div className="flex-1 bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          {view === 'week' && (
              <div className="grid grid-cols-8 border-b border-border bg-gray-50">
                  <div className="p-4 text-center border-r border-border font-bold text-xs text-secondary">GMT+1</div>
                  {weekDays.map(day => (
                      <div key={day.toString()} className={`p-2 text-center border-r border-border last:border-none ${isToday(day) ? 'bg-primary-50' : ''}`}>
                          <div className="text-xs font-bold uppercase text-secondary mb-1">{format(day, 'EEE', { locale: es })}</div>
                          <div className={`
                             w-8 h-8 mx-auto flex items-center justify-center rounded-full font-bold text-sm
                             ${isToday(day) ? 'bg-primary text-white' : 'text-main'}
                             ${isSameDay(day, currentDate) && !isToday(day) ? 'bg-black text-white' : ''}
                          `}>
                              {format(day, 'd')}
                          </div>
                      </div>
                  ))}
              </div>
          )}

          <div className="flex-1 overflow-y-auto relative custom-scrollbar">
              <div className={`grid ${view === 'week' ? 'grid-cols-8' : 'grid-cols-1'}`}>
                  {view === 'week' && (
                      <div className="border-r border-border bg-gray-50">
                          {hours.map(hour => (
                              <div key={hour} className="h-[60px] border-b border-border text-xs font-medium text-secondary p-2 text-right">
                                  {hour}:00
                              </div>
                          ))}
                      </div>
                  )}

                  {(view === 'week' ? weekDays : [currentDate]).map((day) => {
                       const dayEvents = events.filter(e => isSameDay(e.start, day));
                       return (
                           <div key={day.toString()} className={`relative border-r border-border last:border-none min-h-[780px] ${view === 'day' ? 'w-full px-4' : ''}`}>
                               {view === 'day' && (
                                   <div className="sticky top-0 z-10 bg-white border-b border-border p-4 mb-4 flex justify-between items-center">
                                       <div className="font-bold text-lg text-secondary">Agenda del Día</div>
                                       <button className="btn btn-primary btn-sm">+ Añadir Tarea</button>
                                   </div>
                               )}
                               {hours.map(hour => (
                                   <div key={hour} className={`border-b border-dashed border-gray-100 group relative ${view === 'day' ? 'h-[80px] flex' : 'h-[60px]'}`} onClick={() => handleSlotClick(day, hour)}>
                                       {view === 'day' && (
                                           <div className="w-16 flex-shrink-0 text-right pr-4 text-xs font-bold text-secondary opacity-50 pt-2 border-r border-gray-100">
                                               {hour}:00
                                           </div>
                                       )}
                                       <div className="flex-1 hover:bg-gray-50 transition-colors p-2"></div>
                                   </div>
                               ))}
                               <div className="absolute top-0 left-0 w-full h-full pointer-events-none pl-[64px] pb-4" style={{ paddingLeft: view === 'day' ? '64px' : '0' }}>
                                    <div className="relative w-full h-full pointer-events-auto">
                                        {dayEvents.map(event => renderEvent(event, view === 'week'))}
                                    </div>
                               </div>
                           </div>
                       );
                  })}
              </div>
          </div>
      </div>
  );
}

// --- CLIENT COMPONENT (Meal Planner) ---
function ClientPlanner({ currentDate, view, setView, changeDate, goToToday }) {
  const mealTypes = [
     { id: 'desayuno', label: 'Desayuno', icon: '☕', color: 'orange' },
     { id: 'almuerzo', label: 'Almuerzo', icon: '🥗', color: 'green' },
     { id: 'merienda', label: 'Merienda', icon: '🍎', color: 'yellow' },
     { id: 'cena', label: 'Cena', icon: '🍽️', color: 'blue' },
  ];

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate, { weekStartsOn: 1 })
  });

  // Mock Meal Data
  const [meals] = useState([
      { date: format(new Date(), 'yyyy-MM-dd'), type: 'desayuno', name: 'Avena con Frutas', cal: 350 },
      { date: format(new Date(), 'yyyy-MM-dd'), type: 'almuerzo', name: 'Ensalada César', cal: 450 },
  ]);

  const getMeal = (date, type) => {
      return meals.find(m => m.date === format(date, 'yyyy-MM-dd') && m.type === type);
  };

  const handleMealClick = (date, type) => {
      const existing = getMeal(date, type);
      if(existing) {
          alert(`Editar: ${existing.name}`);
      } else {
          // Navigate to add meal logic could go here
          alert(`Añadir comida para ${type} el ${format(date, 'dd/MM')}`);
      }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
        {/* Navigation Cards inside Planner Context (optional, but keep it clean) */}
        
        {view === 'day' ? (
            /* DAY VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mealTypes.map(meal => {
                    const data = getMeal(currentDate, meal.id);
                    return (
                        <div 
                           key={meal.id} 
                           onClick={() => handleMealClick(currentDate, meal.id)}
                           className={`
                             card cursor-pointer hover:border-${meal.color}-400 transition-all group
                             ${data ? `bg-${meal.color}-50 border-${meal.color}-200` : 'border-dashed border-2'}
                           `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{meal.icon}</span>
                                    <h3 className={`font-bold text-lg capitalize ${data ? `text-${meal.color}-900` : 'text-secondary'}`}>
                                        {meal.label}
                                    </h3>
                                </div>
                                {data ? (
                                    <span className={`badge bg-white text-${meal.color}-700 shadow-sm`}>Completo</span>
                                ) : (
                                    <span className="btn-icon w-8 h-8 rounded-full bg-gray-100 text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">+</span>
                                )}
                            </div>
                            
                            {data ? (
                                <div>
                                    <div className="font-medium text-lg mb-1">{data.name}</div>
                                    <div className="text-sm font-bold opacity-70">🔥 {data.cal} Kcal</div>
                                </div>
                            ) : (
                                <div className="text-secondary text-sm py-4">
                                    No hay registro aún. Haz clic para añadir.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        ) : (
            /* WEEK VIEW */
            <div className="card p-0 overflow-hidden border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-border">
                                <th className="p-4 text-left min-w-[100px] text-secondary">Comida</th>
                                {weekDays.map(day => (
                                    <th key={day.toString()} className={`p-3 text-center min-w-[120px] ${isToday(day) ? 'bg-primary-50 text-primary-700' : ''}`}>
                                        <div className="uppercase text-xs font-bold mb-1">{format(day, 'EEE', { locale: es })}</div>
                                        <div className="text-lg font-bold">{format(day, 'd')}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mealTypes.map(meal => (
                                <tr key={meal.id} className="border-b border-border last:border-none hover:bg-gray-50/50">
                                    <td className="p-4 font-bold text-secondary sticky left-0 bg-white border-r border-gray-100">
                                        <span className="mr-2">{meal.icon}</span> {meal.label}
                                    </td>
                                    {weekDays.map(day => {
                                        const data = getMeal(day, meal.id);
                                        return (
                                            <td 
                                               key={day.toString()} 
                                               className="p-2 border-r border-dashed border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                               onClick={() => handleMealClick(day, meal.id)}
                                            >
                                                {data ? (
                                                    <div className={`p-2 rounded-lg bg-${meal.color}-50 text-${meal.color}-900 border border-${meal.color}-100 text-xs`}>
                                                        <div className="font-bold truncate">{data.name}</div>
                                                        <div className="opacity-75">{data.cal} kcal</div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 text-primary font-bold text-xl">
                                                        +
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}


export default function Planificador() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = api.auth.isAdmin();
  
  // State from URL or defaults
  const dateParam = searchParams.get('date');
  const [currentDate, setCurrentDate] = useState(() => dateParam ? new Date(dateParam) : new Date());
  const [view, setView] = useState('day'); // 'day', 'week'

  // Update URL when date changes
  useEffect(() => {
    setSearchParams({ date: format(currentDate, 'yyyy-MM-dd') });
  }, [currentDate, setSearchParams]);

  const changeDate = (amount) => {
    if (view === 'day') setCurrentDate(prev => addDays(prev, amount));
    else setCurrentDate(prev => addWeeks(prev, amount));
  };
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      {/* Shared Header Controls */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
             <div className="p-2 bg-primary-50 rounded-lg text-primary text-2xl">
                {isAdmin ? '📅' : '🍱'}
             </div>
             <div>
                <h1 className="text-2xl font-bold font-heading">
                    {isAdmin ? 'Planificador' : 'Mi Menú Semanal'}
                </h1>
                <p className="text-secondary text-sm">
                    {isAdmin ? 'Gestiona tu agenda y tareas' : 'Organiza tus comidas y lleva un registro'}
                </p>
             </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-border bg-white shadow-sm">
            <button onClick={() => setView('day')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'day' ? 'bg-primary text-white shadow' : 'hover:bg-gray-50 text-secondary'}`}>Día</button>
            <button onClick={() => setView('week')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'week' ? 'bg-primary text-white shadow' : 'hover:bg-gray-50 text-secondary'}`}>Semana</button>
        </div>

        <div className="flex items-center gap-4">
            <button onClick={() => changeDate(-1)} className="btn-icon w-9 h-9 border border-border rounded-lg hover:bg-gray-50">←</button>
            <div className="text-center min-w-[200px]">
                <span className="font-bold text-lg capitalize block text-main">
                    {format(currentDate, view === 'day' ? "EEEE d 'de' MMMM" : "'Semana' w, MMM yyyy", { locale: es })}
                </span>
                {view === 'day' && isToday(currentDate) && <span className="text-xs font-bold text-primary uppercase tracking-wider">Hoy</span>}
            </div>
            <button onClick={() => changeDate(1)} className="btn-icon w-9 h-9 border border-border rounded-lg hover:bg-gray-50">→</button>
            
            <button onClick={goToToday} className="btn btn-ghost btn-sm text-primary font-bold">Hoy</button>
        </div>
      </header>
      
      {/* Route to correct component based on role */}
      {isAdmin ? (
          <AdminPlanner 
            currentDate={currentDate} 
            view={view} 
            setView={setView} 
            changeDate={changeDate} 
            goToToday={goToToday} 
          />
      ) : (
          <ClientPlanner 
            currentDate={currentDate} 
            view={view} 
            setView={setView} 
            changeDate={changeDate} 
            goToToday={goToToday} 
          />
      )}
    </div>
  );
}
