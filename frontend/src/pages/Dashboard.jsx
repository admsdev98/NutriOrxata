import { useEffect, useMemo, useState } from 'react';
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

function AdminCalendar({ onPickDate }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const todayKey = formatDate(new Date());

  const days = useMemo(() => {
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

  function prevMonth() {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() - 1);
    setCursor(d);
  }

  function nextMonth() {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + 1);
    setCursor(d);
  }

  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', textTransform: 'capitalize' }}>{monthLabel}</div>
          <div className="text-secondary" style={{ fontSize: '0.9rem' }}>Selecciona un dia para abrir el planificador</div>
        </div>
        <div className="flex" style={{ gap: '8px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={prevMonth}>Anterior</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={nextMonth}>Siguiente</button>
        </div>
      </div>

      <div className="grid grid-cols-7" style={{ gap: '8px', marginBottom: '10px' }}>
        {weekDays.map(d => (
          <div key={d} className="text-secondary" style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center' }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7" style={{ gap: '8px' }}>
        {days.days.map(d => {
          const inMonth = d.getMonth() === days.month;
          const key = formatDate(d);
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPickDate(d)}
              className="btn"
              style={{
                padding: '10px 0',
                borderRadius: '14px',
                borderColor: isToday ? 'var(--primary-500)' : 'var(--border-color)',
                background: isToday ? 'var(--primary-50)' : 'var(--bg-card)',
                color: inMonth ? 'var(--text-main)' : 'var(--text-muted)',
                opacity: inMonth ? 1 : 0.55,
                fontWeight: 800
              }}
              aria-label={`Dia ${d.getDate()}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ ingredientes: 0, platos: 0, clientes: 0 });
  const [platosRecientes, setPlatosRecientes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [ingredientes, platos, clientes] = await Promise.all([
        api.ingredientes.list(),
        api.platos.list(),
        api.auth.listUsers({ rol: 'cliente' }),
      ]);

      setStats({
        ingredientes: Array.isArray(ingredientes) ? ingredientes.length : 0,
        platos: Array.isArray(platos) ? platos.length : 0,
        clientes: Array.isArray(clientes?.items) ? clientes.items.length : 0,
      });
      setPlatosRecientes(Array.isArray(platos) ? platos.slice(0, 6) : []);
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gap: '16px' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="text-secondary" style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ingredientes</div>
          <div style={{ fontWeight: 900, fontSize: '2rem', marginTop: '8px' }}>{stats.ingredientes}</div>
        </div>
        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="text-secondary" style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platos</div>
          <div style={{ fontWeight: 900, fontSize: '2rem', marginTop: '8px' }}>{stats.platos}</div>
        </div>
        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="text-secondary" style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clientes</div>
          <div style={{ fontWeight: 900, fontSize: '2rem', marginTop: '8px' }}>{stats.clientes}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminCalendar onPickDate={(d) => navigate(`/planificador?date=${formatDate(d)}`)} />
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="card-header" style={{ marginBottom: '12px' }}>
            <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Platos recientes</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate('/platos')}>Ver todos</button>
          </div>

          {platosRecientes.length === 0 ? (
            <div className="text-secondary">No hay platos creados.</div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {platosRecientes.map(p => (
                <div key={p.id} style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                  <div style={{ fontWeight: 900, marginBottom: '6px' }}>{p.nombre}</div>
                  <div className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-secondary">{Math.round(p.calorias_totales)} kcal</span>
                    {(Array.isArray(p.momentos_dia) && p.momentos_dia.length ? p.momentos_dia : (p.momento_dia ? [p.momento_dia] : [])).slice(0, 2).map(m => (
                      <span key={m} className="badge badge-primary">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/planificador?date=${formatDate(today)}`)}>
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/planificador?date=${formatDate(today)}`)}>
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
        <div className="date-badge">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </header>

      {isAdmin ? <AdminDashboard /> : <ClientDashboard user={user} />}
    </div>
  );
}
