import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';

function formatDate(d) {
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

function formatDateTimeLocal(d) {
  const date = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function parseDateOnly(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const out = new Date(y, m - 1, d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function startOfWeek(date) {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function Modal({ title, children, onClose, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar">X</button>
        </div>
        <div className="modal-body custom-scrollbar">{children}</div>
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
  );
}

function TaskModal({ initial, workers, isAdmin, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    titulo: initial?.titulo || '',
    descripcion: initial?.descripcion || '',
    fecha_limite: initial?.fecha_limite ? formatDateTimeLocal(initial.fecha_limite) : '',
    estado: initial?.estado || 'pendiente',
    prioridad: initial?.prioridad || 'media',
    asignado_a_id: initial?.asignado_a_id || '',
  }));

  return (
    <Modal
      title={initial ? 'Editar tarea' : 'Nueva tarea'}
      onClose={onClose}
      footer={
        <>
          {initial && (
            <button type="button" className="btn btn-danger" onClick={() => onDelete(initial.id)}>
              Borrar
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const payload = {
                titulo: form.titulo.trim(),
                descripcion: form.descripcion.trim() || null,
                fecha_limite: form.fecha_limite ? `${form.fecha_limite}:00` : null,
                estado: form.estado,
                prioridad: form.prioridad,
                asignado_a_id: Number(form.asignado_a_id),
              };
              onSave(payload);
            }}
            disabled={!form.titulo.trim() || !form.asignado_a_id}
          >
            Guardar
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Titulo</label>
          <input className="form-input" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Asignada a</label>
          <select
            className="form-select"
            value={form.asignado_a_id}
            onChange={(e) => setForm((p) => ({ ...p, asignado_a_id: e.target.value }))}
            disabled={!isAdmin && !!initial?.asignado_a_id}
          >
            <option value="">Selecciona...</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Fecha limite</label>
          <input
            type="datetime-local"
            className="form-input"
            value={form.fecha_limite}
            onChange={(e) => setForm((p) => ({ ...p, fecha_limite: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estado</label>
            <select className="form-select" value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}>
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="hecha">Hecha</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Prioridad</label>
            <select className="form-select" value={form.prioridad} onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value }))}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        <div className="form-group md:col-span-2" style={{ marginBottom: 0 }}>
          <label className="form-label">Descripcion</label>
          <textarea
            className="form-textarea"
            rows={5}
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}

function AppointmentModal({ initial, workers, isAdmin, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    titulo: initial?.titulo || '',
    descripcion: initial?.descripcion || '',
    tipo: initial?.tipo || 'telefono',
    empieza_en: initial?.empieza_en ? formatDateTimeLocal(initial.empieza_en) : formatDateTimeLocal(new Date()),
    termina_en: initial?.termina_en ? formatDateTimeLocal(initial.termina_en) : '',
    enlace: initial?.enlace || '',
    telefono: initial?.telefono || '',
    asignado_a_id: initial?.asignado_a_id || '',
  }));

  return (
    <Modal
      title={initial ? 'Editar cita' : 'Nueva cita'}
      onClose={onClose}
      footer={
        <>
          {initial && (
            <button type="button" className="btn btn-danger" onClick={() => onDelete(initial.id)}>
              Borrar
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const payload = {
                titulo: form.titulo.trim(),
                descripcion: form.descripcion.trim() || null,
                tipo: form.tipo,
                empieza_en: `${form.empieza_en}:00`,
                termina_en: form.termina_en ? `${form.termina_en}:00` : null,
                enlace: form.enlace.trim() || null,
                telefono: form.telefono.trim() || null,
                asignado_a_id: Number(form.asignado_a_id),
              };
              onSave(payload);
            }}
            disabled={!form.titulo.trim() || !form.empieza_en || !form.asignado_a_id}
          >
            Guardar
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Titulo</label>
          <input className="form-input" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Asignada a</label>
          <select className="form-select" value={form.asignado_a_id} onChange={(e) => setForm((p) => ({ ...p, asignado_a_id: e.target.value }))}>
            <option value="">Selecciona...</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tipo</label>
          <select className="form-select" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
            <option value="telefono">Telefonica</option>
            <option value="videollamada">Videollamada</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Empieza</label>
          <input type="datetime-local" className="form-input" value={form.empieza_en} onChange={(e) => setForm((p) => ({ ...p, empieza_en: e.target.value }))} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Termina</label>
          <input type="datetime-local" className="form-input" value={form.termina_en} onChange={(e) => setForm((p) => ({ ...p, termina_en: e.target.value }))} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Telefono</label>
          <input className="form-input" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} />
        </div>

        <div className="form-group md:col-span-2" style={{ marginBottom: 0 }}>
          <label className="form-label">Enlace (si videollamada)</label>
          <input className="form-input" value={form.enlace} onChange={(e) => setForm((p) => ({ ...p, enlace: e.target.value }))} />
        </div>

        <div className="form-group md:col-span-2" style={{ marginBottom: 0 }}>
          <label className="form-label">Descripcion</label>
          <textarea className="form-textarea" rows={5} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
        </div>
      </div>
    </Modal>
  );
}

function NoteModal({ initial, workers, isAdmin, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    titulo: initial?.titulo || '',
    contenido: initial?.contenido || '',
    fecha: initial?.fecha || formatDate(new Date()),
    usuario_id: initial?.usuario_id || '',
  }));

  return (
    <Modal
      title={initial ? 'Editar nota' : 'Nueva nota'}
      onClose={onClose}
      footer={
        <>
          {initial && (
            <button type="button" className="btn btn-danger" onClick={() => onDelete(initial.id)}>
              Borrar
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const payload = {
                titulo: form.titulo.trim() || null,
                contenido: form.contenido.trim(),
                fecha: form.fecha || null,
                usuario_id: Number(form.usuario_id),
              };
              onSave(payload);
            }}
            disabled={!form.contenido.trim() || !form.usuario_id}
          >
            Guardar
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Titulo</label>
          <input className="form-input" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Trabajador</label>
          <select className="form-select" value={form.usuario_id} onChange={(e) => setForm((p) => ({ ...p, usuario_id: e.target.value }))}>
            <option value="">Selecciona...</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Fecha</label>
          <input type="date" className="form-input" value={form.fecha} onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} />
        </div>

        <div className="form-group md:col-span-2" style={{ marginBottom: 0 }}>
          <label className="form-label">Contenido</label>
          <textarea className="form-textarea" rows={7} value={form.contenido} onChange={(e) => setForm((p) => ({ ...p, contenido: e.target.value }))} />
        </div>
      </div>
    </Modal>
  );
}

const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 56;

function buildHours() {
  const out = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) out.push(h);
  return out;
}

function dateKey(d) {
  return formatDate(d);
}

function getMonthGrid(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const start = startOfWeek(first);
  const end = startOfWeek(addDays(last, 6));
  const weekdayEnd = (last.getDay() + 6) % 7;
  const endAdjusted = addDays(last, 6 - weekdayEnd);
  endAdjusted.setHours(0, 0, 0, 0);

  const days = [];
  const d = new Date(start);
  while (d <= endAdjusted) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return { month, days, start, end: endAdjusted };
}

function AppointmentBlock({ item, dayStart, onClick }) {
  const start = new Date(item.empieza_en);
  const end = item.termina_en ? new Date(item.termina_en) : new Date(start.getTime() + 30 * 60000);
  const minutesFrom = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
  const minutesTo = (end.getHours() - START_HOUR) * 60 + end.getMinutes();
  const top = (minutesFrom / 60) * HOUR_HEIGHT;
  const height = Math.max((minutesTo - minutesFrom) / 60 * HOUR_HEIGHT, HOUR_HEIGHT * 0.5);

  const bg = item.tipo === 'videollamada' ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)';
  const border = item.tipo === 'videollamada' ? 'rgba(59,130,246,0.35)' : 'rgba(16,185,129,0.35)';
  const color = item.tipo === 'videollamada' ? 'var(--accent-info)' : 'var(--accent-success)';

  return (
    <button
      type="button"
      onClick={onClick}
      className="card"
      style={{
        position: 'absolute',
        left: 10,
        right: 10,
        top,
        height,
        padding: '10px 12px',
        textAlign: 'left',
        cursor: 'pointer',
        boxShadow: 'none',
        background: bg,
        borderColor: border,
      }}
      title={item.descripcion || item.titulo}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <div style={{ fontWeight: 900, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titulo}</div>
        <div className="badge badge-secondary" style={{ borderColor: border, color }}>
          {item.tipo === 'videollamada' ? 'Video' : 'Tel'}
        </div>
      </div>
      <div className="text-secondary" style={{ fontWeight: 800, fontSize: '0.78rem', marginTop: 6 }}>
        {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        {' - '}
        {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </button>
  );
}

export default function PlanificadorTrabajo({ initialDate }) {
  const isAdmin = api.auth.isAdmin();
  const user = api.auth.getUser();

  const [view, setView] = useState('day');
  const [cursor, setCursor] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [workers, setWorkers] = useState([]);
  const [workerId, setWorkerId] = useState(() => user?.id || null);

  const [tasks, setTasks] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);

  // Week view responsiveness
  const weekContainerRef = useRef(null);
  const [weekDaysPerPage, setWeekDaysPerPage] = useState(7);
  const [weekStartIndex, setWeekStartIndex] = useState(0);
  const [focusDate, setFocusDate] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const hours = useMemo(() => buildHours(), []);

  const range = useMemo(() => {
    if (view === 'month') {
      const grid = getMonthGrid(cursor);
      return { start: grid.start, end: grid.end, grid };
    }
    if (view === 'week') {
      const start = startOfWeek(cursor);
      const end = addDays(start, 6);
      return { start, end };
    }
    return { start: cursor, end: cursor };
  }, [view, cursor]);

  const weekWindow = useMemo(() => {
    if (view !== 'week') return null;
    const weekStart = startOfWeek(cursor);
    const safeDays = Math.max(1, Math.min(7, weekDaysPerPage));
    const maxStart = Math.max(0, 7 - safeDays);
    const safeStartIndex = clamp(weekStartIndex, 0, maxStart);
    const days = Array.from({ length: safeDays }).map((_, i) => addDays(weekStart, safeStartIndex + i));
    return { weekStart, days, safeDays, maxStart, safeStartIndex };
  }, [view, cursor, weekDaysPerPage, weekStartIndex]);

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    if (view !== 'week') return;
    const el = weekContainerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    function computeDays(width) {
      if (width < 860) return 3;
      if (width < 1180) return 5;
      return 7;
    }

    const ro = new ResizeObserver((entries) => {
      const width = entries?.[0]?.contentRect?.width;
      if (!width) return;
      const next = computeDays(width);
      setWeekDaysPerPage((prev) => (prev === next ? prev : next));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  useEffect(() => {
    if (view !== 'week') return;
    const weekStart = startOfWeek(cursor);
    const weekEnd = addDays(weekStart, 6);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const keepCurrent = focusDate >= weekStart && focusDate <= weekEnd;
    const nextFocus = keepCurrent ? focusDate : (today >= weekStart && today <= weekEnd ? today : weekStart);
    setFocusDate(nextFocus);
  }, [view, cursor]);

  useEffect(() => {
    if (view !== 'week') return;
    // When days-per-page changes, keep window valid and keep focus visible.
    const safeDays = Math.max(1, Math.min(7, weekDaysPerPage));
    const maxStart = Math.max(0, 7 - safeDays);
    setWeekStartIndex((prev) => clamp(prev, 0, maxStart));
  }, [view, weekDaysPerPage]);

  useEffect(() => {
    if (view !== 'week') return;
    if (!weekWindow) return;
    const first = weekWindow.days[0];
    const last = weekWindow.days[weekWindow.days.length - 1];
    if (focusDate < first || focusDate > last) {
      setFocusDate(first);
    }
  }, [view, weekWindow]);

  useEffect(() => {
    if (!workerId) return;
    loadAll();
  }, [view, workerId, range.start?.getTime(), range.end?.getTime()]);

  async function loadWorkers() {
    try {
      if (!isAdmin) {
        setWorkers(user ? [user] : []);
        setWorkerId(user?.id || null);
        return;
      }
      const data = await api.auth.listUsers({ rol: 'admin' });
      const items = data.items || [];
      setWorkers(items);
      if (!workerId && items.length) setWorkerId(items[0].id);
    } catch (e) {
      console.error(e);
      setWorkers(user ? [user] : []);
      setWorkerId(user?.id || null);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      const params = {
        start: formatDate(range.start),
        end: formatDate(range.end),
        asignado_a_id: workerId,
      };

      const [t, a, n, s] = await Promise.all([
        api.workPlanner.tasks.list(params),
        api.workPlanner.appointments.list(params),
        api.workPlanner.notes.list({ start: params.start, end: params.end, usuario_id: workerId }),
        view === 'month' ? api.workPlanner.summary(params) : Promise.resolve(null),
      ]);

      setTasks(Array.isArray(t) ? t : []);
      setAppointments(Array.isArray(a) ? a : []);
      setNotes(Array.isArray(n) ? n : []);
      setSummary(s);
    } catch (e) {
      console.error(e);
      setTasks([]);
      setAppointments([]);
      setNotes([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  function navPrev() {
    if (view === 'month') {
      const d = new Date(cursor);
      d.setMonth(d.getMonth() - 1);
      setCursor(d);
      return;
    }
    if (view === 'week') {
      setCursor(addDays(cursor, -7));
      setWeekStartIndex(0);
      return;
    }
    setCursor(addDays(cursor, -1));
  }

  function navNext() {
    if (view === 'month') {
      const d = new Date(cursor);
      d.setMonth(d.getMonth() + 1);
      setCursor(d);
      return;
    }
    if (view === 'week') {
      setCursor(addDays(cursor, 7));
      setWeekStartIndex(0);
      return;
    }
    setCursor(addDays(cursor, 1));
  }

  function openNewTask() {
    const base = view === 'week' ? (focusDate || range.start) : range.start;
    setModal({ type: 'task', item: null, defaults: { fecha_limite: formatDateTimeLocal(base) } });
  }

  function openNewNote() {
    const base = view === 'week' ? (focusDate || range.start) : range.start;
    setModal({ type: 'note', item: null, defaults: { fecha: formatDate(base) } });
  }

  function openNewAppointment(dateTime) {
    setModal({ type: 'appointment', item: null, defaults: { empieza_en: formatDateTimeLocal(dateTime) } });
  }

  async function saveTask(payload) {
    try {
      if (modal?.item?.id) await api.workPlanner.tasks.update(modal.item.id, payload);
      else await api.workPlanner.tasks.create(payload);
      setModal(null);
      loadAll();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function deleteTask(id) {
    if (!confirm('Borrar tarea?')) return;
    try {
      await api.workPlanner.tasks.delete(id);
      setModal(null);
      loadAll();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function saveAppointment(payload) {
    try {
      if (modal?.item?.id) await api.workPlanner.appointments.update(modal.item.id, payload);
      else await api.workPlanner.appointments.create(payload);
      setModal(null);
      loadAll();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function deleteAppointment(id) {
    if (!confirm('Borrar cita?')) return;
    try {
      await api.workPlanner.appointments.delete(id);
      setModal(null);
      loadAll();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function saveNote(payload) {
    try {
      if (modal?.item?.id) await api.workPlanner.notes.update(modal.item.id, payload);
      else await api.workPlanner.notes.create(payload);
      setModal(null);
      loadAll();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  async function deleteNote(id) {
    if (!confirm('Borrar nota?')) return;
    try {
      await api.workPlanner.notes.delete(id);
      setModal(null);
      loadAll();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const dayLabel = cursor.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });

  const tasksForRange = useMemo(() => {
    const startKey = formatDate(range.start);
    const endKey = formatDate(range.end);
    const withDue = [];
    const noDue = [];
    for (const t of tasks) {
      if (!t.fecha_limite) {
        noDue.push(t);
        continue;
      }
      const k = formatDate(t.fecha_limite);
      if (k >= startKey && k <= endKey) withDue.push(t);
    }
    return { withDue, noDue };
  }, [tasks, range.start, range.end]);

  const notesForDay = useMemo(() => {
    const base = view === 'week' ? (focusDate || range.start) : range.start;
    const key = formatDate(base);
    return notes.filter((n) => (n.fecha || '') === key);
  }, [notes, range.start, view, focusDate]);

  const apptsByDay = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const k = formatDate(a.empieza_en);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(a);
    }
    for (const [k, items] of map.entries()) {
      items.sort((x, y) => new Date(x.empieza_en) - new Date(y.empieza_en));
      map.set(k, items);
    }
    return map;
  }, [appointments]);

  const headerRight = (
    <div className="flex flex-col md:flex-row" style={{ gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
      <div style={{ minWidth: 260, width: '100%' }}>
        <label className="form-label">Trabajador</label>
        <select className="form-select" value={workerId || ''} onChange={(e) => setWorkerId(Number(e.target.value))}>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>{w.nombre}</option>
          ))}
        </select>
      </div>

      <div style={{ minWidth: 240, width: '100%' }}>
        <label className="form-label">Vista</label>
        <div className="flex" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '4px' }}>
          {['day', 'week', 'month'].map((v) => (
            <button
              key={v}
              type="button"
              className="btn btn-sm"
              style={{
                flex: 1,
                border: 'none',
                background: view === v ? 'var(--bg-card)' : 'transparent',
                boxShadow: view === v ? 'var(--shadow-sm)' : 'none',
                color: view === v ? 'var(--accent-primary)' : 'var(--text-secondary)',
                textTransform: 'capitalize',
              }}
              onClick={() => setView(v)}
            >
              {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        <label className="form-label">Fecha</label>
        <div className="flex items-center" style={{ gap: 8 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={navPrev}>&lt;</button>
          <input
            type="date"
            className="form-input"
            value={formatDate(cursor)}
            onChange={(e) => {
              const d = parseDateOnly(e.target.value);
              if (d) setCursor(d);
            }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={navNext}>&gt;</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 24 }}>
      <div className="card" style={{ padding: 14, marginBottom: 18 }}>
        <div className="flex flex-col md:flex-row" style={{ gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: 4 }}>Planificador de trabajo</div>
            <div className="text-secondary" style={{ fontSize: '0.95rem' }}>
              Organiza tareas, citas y notas con vistas diaria, semanal y mensual.
            </div>
          </div>
          {headerRight}
        </div>
      </div>

      <div className="flex" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" className="btn btn-primary" onClick={openNewTask}>Nueva tarea</button>
        <button type="button" className="btn btn-secondary" onClick={() => openNewAppointment(new Date())}>Nueva cita</button>
        <button type="button" className="btn btn-secondary" onClick={openNewNote}>Nueva nota</button>
        <div className="badge badge-secondary" style={{ marginLeft: 'auto' }}>{view === 'month' ? monthLabel : dayLabel}</div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : view === 'month' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16 }}>
            <div className="grid grid-cols-7" style={{ marginBottom: 12 }}>
              {WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-secondary">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7" style={{ gap: 12 }}>
              {range.grid.days.map((d) => {
                const inMonth = d.getMonth() === range.grid.month;
                const key = dateKey(d);
                const daySummary = summary?.dias?.find((x) => x.fecha === key) || null;
                const isToday = key === formatDate(new Date());
                return (
                  <button
                    key={key}
                    type="button"
                    className="card"
                    onClick={() => {
                      setCursor(d);
                      setView('day');
                    }}
                    style={{
                      padding: 12,
                      textAlign: 'left',
                      boxShadow: 'none',
                      background: isToday ? 'var(--primary-50)' : 'var(--bg-card)',
                      opacity: inMonth ? 1 : 0.5,
                      borderColor: isToday ? 'rgba(249,115,22,0.35)' : 'var(--border-color)',
                      minHeight: 110,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 900 }}>{d.getDate()}</div>
                      {daySummary && (daySummary.tareas + daySummary.citas + daySummary.notas) > 0 && (
                        <div className="badge badge-secondary">Actividad</div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {!!daySummary?.tareas && (
                        <div className="badge badge-primary" style={{ justifyContent: 'space-between', gap: 8 }}>
                          Tareas: {daySummary.tareas}
                        </div>
                      )}
                      {!!daySummary?.citas && (
                        <div className="badge badge-secondary" style={{ borderColor: 'rgba(16,185,129,0.35)', color: 'var(--accent-success)' }}>
                          Citas: {daySummary.citas}
                        </div>
                      )}
                      {!!daySummary?.notas && (
                        <div className="badge badge-secondary" style={{ borderColor: 'rgba(59,130,246,0.35)', color: 'var(--accent-info)' }}>
                          Notas: {daySummary.notas}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div
            ref={weekContainerRef}
            className="card lg:col-span-2"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            <div style={{ padding: 14, borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900 }}>{view === 'week' ? 'Semana' : 'Agenda del dia'}</div>
                {view === 'week' && weekWindow && weekWindow.maxStart > 0 && (
                  <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setWeekStartIndex((v) => clamp(v - weekWindow.safeDays, 0, weekWindow.maxStart))}
                      title="Dias anteriores"
                    >
                      &lt;
                    </button>
                    <div className="badge badge-secondary">
                      {weekWindow.safeStartIndex + 1}-{weekWindow.safeStartIndex + weekWindow.safeDays} / 7
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setWeekStartIndex((v) => clamp(v + weekWindow.safeDays, 0, weekWindow.maxStart))}
                      title="Dias siguientes"
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </div>
              <div className="text-secondary" style={{ fontSize: '0.9rem' }}>
                {view === 'week'
                  ? `${formatDate(range.start)} - ${formatDate(range.end)}`
                  : cursor.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {view === 'day' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}>
                <div style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-app)' }}>
                  {hours.map((h) => (
                    <div key={h} style={{ height: HOUR_HEIGHT, padding: '8px 10px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    position: 'relative',
                    backgroundImage: 'linear-gradient(to bottom, var(--border-color) 1px, transparent 1px)',
                    backgroundSize: `100% ${HOUR_HEIGHT}px`,
                    backgroundColor: 'var(--bg-card)',
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const hour = START_HOUR + Math.floor(y / HOUR_HEIGHT);
                    const dt = new Date(cursor);
                    dt.setHours(clamp(hour, START_HOUR, END_HOUR), 0, 0, 0);
                    openNewAppointment(dt);
                  }}
                >
                  {(apptsByDay.get(formatDate(cursor)) || []).map((a) => (
                    <AppointmentBlock
                      key={a.id}
                      item={a}
                      dayStart={cursor}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setModal({ type: 'appointment', item: a });
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="custom-scrollbar" style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 64 + (weekWindow ? weekWindow.days.length : 7) * 220 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `64px repeat(${weekWindow ? weekWindow.days.length : 7}, minmax(220px, 1fr))`,
                      borderBottom: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 5,
                    }}
                  >
                    <div style={{ background: 'var(--bg-app)' }} />
                    {(weekWindow ? weekWindow.days : Array.from({ length: 7 }).map((_, i) => addDays(range.start, i))).map((d, i) => {
                      const key = formatDate(d);
                      const isFocused = view === 'week' && sameDay(d, focusDate);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFocusDate(d)}
                          className="card"
                          style={{
                            padding: '10px 12px',
                            borderLeft: '1px solid var(--border-color)',
                            borderRadius: 0,
                            boxShadow: 'none',
                            background: isFocused ? 'var(--primary-50)' : 'var(--bg-card)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderColor: isFocused ? 'rgba(249,115,22,0.35)' : 'var(--border-color)',
                          }}
                        >
                          <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {WEEKDAYS_SHORT[(weekWindow ? weekWindow.safeStartIndex : 0) + i] || WEEKDAYS_SHORT[i]}
                          </div>
                          <div style={{ fontWeight: 900 }}>{d.getDate()} / {d.getMonth() + 1}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `64px repeat(${weekWindow ? weekWindow.days.length : 7}, minmax(220px, 1fr))`, height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}>
                    <div style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-app)' }}>
                      {hours.map((h) => (
                        <div key={h} style={{ height: HOUR_HEIGHT, padding: '8px 10px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                          {String(h).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>
                    {(weekWindow ? weekWindow.days : Array.from({ length: 7 }).map((_, i) => addDays(range.start, i))).map((d) => {
                      const k = formatDate(d);
                      const items = apptsByDay.get(k) || [];
                      const isFocused = view === 'week' && sameDay(d, focusDate);
                      return (
                        <div
                          key={k}
                          style={{
                            position: 'relative',
                            borderLeft: '1px solid var(--border-color)',
                            backgroundImage: 'linear-gradient(to bottom, var(--border-color) 1px, transparent 1px)',
                            backgroundSize: `100% ${HOUR_HEIGHT}px`,
                            backgroundColor: isFocused ? 'rgba(249,115,22,0.05)' : 'transparent',
                          }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const hour = START_HOUR + Math.floor(y / HOUR_HEIGHT);
                            const dt = new Date(d);
                            dt.setHours(clamp(hour, START_HOUR, END_HOUR), 0, 0, 0);
                            setFocusDate(d);
                            openNewAppointment(dt);
                          }}
                        >
                          {items.map((a) => (
                            <AppointmentBlock
                              key={a.id}
                              item={a}
                              dayStart={d}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setFocusDate(d);
                                setModal({ type: 'appointment', item: a });
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="card-header">
                <h3 className="card-title">Tareas</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={openNewTask}>Anadir</button>
              </div>

              {tasksForRange.withDue.length === 0 && tasksForRange.noDue.length === 0 ? (
                <div className="text-secondary">Sin tareas.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {tasksForRange.withDue.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="card"
                      onClick={() => setModal({ type: 'task', item: t })}
                      style={{ padding: 12, textAlign: 'left', background: 'var(--bg-input)', boxShadow: 'none' }}
                    >
                      <div className="flex" style={{ justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                        <div style={{ fontWeight: 900 }}>{t.titulo}</div>
                        <div className="badge badge-secondary">{t.prioridad}</div>
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.85rem', marginTop: 6, fontWeight: 800 }}>
                        {t.fecha_limite ? new Date(t.fecha_limite).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                        {' · '}
                        {t.estado}
                      </div>
                    </button>
                  ))}

                  {tasksForRange.noDue.length > 0 && (
                    <div className="card" style={{ background: 'var(--bg-card)', boxShadow: 'none', padding: 12 }}>
                      <div className="text-secondary" style={{ fontWeight: 900, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>Sin fecha limite</div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {tasksForRange.noDue.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className="card"
                            onClick={() => setModal({ type: 'task', item: t })}
                            style={{ padding: 10, textAlign: 'left', background: 'var(--bg-input)', boxShadow: 'none' }}
                          >
                            <div className="flex" style={{ justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                              <div style={{ fontWeight: 900 }}>{t.titulo}</div>
                              <div className="badge badge-secondary">{t.estado}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="card-header">
                <h3 className="card-title">Notas</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={openNewNote}>Anadir</button>
              </div>
              {view === 'week' && (
                <div className="badge badge-secondary" style={{ marginBottom: 12 }}>
                  {focusDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </div>
              )}
              {notesForDay.length === 0 ? (
                <div className="text-secondary">Sin notas para este dia.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {notesForDay.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="card"
                      onClick={() => setModal({ type: 'note', item: n })}
                      style={{ padding: 12, textAlign: 'left', background: 'var(--bg-input)', boxShadow: 'none' }}
                    >
                      <div style={{ fontWeight: 900, marginBottom: 6 }}>{n.titulo || 'Nota'}</div>
                      <div className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                        {(n.contenido || '').slice(0, 180)}{(n.contenido || '').length > 180 ? '...' : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="card-header">
                <h3 className="card-title">Correos</h3>
                <span className="badge badge-secondary">Proximamente</span>
              </div>
              <div className="text-secondary" style={{ fontSize: '0.95rem' }}>
                Este bloque queda preparado para integrar gestion de correos.
              </div>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'task' && (
        <TaskModal
          initial={modal.item ? modal.item : (modal.defaults ? { ...modal.defaults, asignado_a_id: workerId } : null)}
          workers={workers}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}
      {modal?.type === 'appointment' && (
        <AppointmentModal
          initial={modal.item ? modal.item : (modal.defaults ? { ...modal.defaults, asignado_a_id: workerId } : null)}
          workers={workers}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSave={saveAppointment}
          onDelete={deleteAppointment}
        />
      )}
      {modal?.type === 'note' && (
        <NoteModal
          initial={modal.item ? modal.item : (modal.defaults ? { ...modal.defaults, usuario_id: workerId } : null)}
          workers={workers}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSave={saveNote}
          onDelete={deleteNote}
        />
      )}
    </div>
  );
}
