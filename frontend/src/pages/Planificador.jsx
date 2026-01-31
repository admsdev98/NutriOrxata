import { useState, useEffect } from 'react';
import api from '../api/client';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_DISPLAY = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo'
};
const MOMENTOS = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
const MOMENTOS_DISPLAY = {
  desayuno: '🌅 Desayuno', almuerzo: '🥪 Almuerzo', comida: '☀️ Comida',
  merienda: '🍎 Merienda', cena: '🌙 Cena'
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

function AsignarPlatoModal({ onClose, onSave, dia, momento, familiarId, platoActual }) {
  const [platos, setPlatos] = useState([]);
  const [selectedPlato, setSelectedPlato] = useState(platoActual || null);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    api.platos.list().then(setPlatos);
  }, []);

  function handleSelect(plato) {
    setSelectedPlato(plato?.id === selectedPlato ? null : plato?.id);
  }

  function handleConfirm() {
    onSave(selectedPlato);
  }

  // First filter by momento_dia if not showing all, then by search
  const platosFiltrados = platos.filter(p => {
    const matchesMomento = showAll || p.momento_dia === momento;
    const matchesSearch = !search || p.nombre.toLowerCase().includes(search.toLowerCase());
    return matchesMomento && matchesSearch;
  });

  // Count how many dishes match this momento
  const platosDelMomento = platos.filter(p => p.momento_dia === momento).length;
  const otrosPlatos = platos.length - platosDelMomento;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            📅 {DIAS_DISPLAY[dia]} - {MOMENTOS_DISPLAY[momento]}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="flex gap-2" style={{ marginBottom: '16px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Buscar plato..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button
              className={`btn btn-sm ${!showAll ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowAll(false)}
              style={{ marginRight: '8px' }}
            >
              {MOMENTOS_DISPLAY[momento]} ({platosDelMomento})
            </button>
            <button
              className={`btn btn-sm ${showAll ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowAll(true)}
            >
              🔍 Ver todos ({platos.length})
            </button>
          </div>

          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            <div
              className={`meal-slot ${!selectedPlato ? 'active' : ''}`}
              onClick={() => handleSelect(null)}
              style={{
                marginBottom: '8px',
                background: !selectedPlato ? 'rgba(99, 102, 241, 0.2)' : undefined,
                border: !selectedPlato ? '1px solid var(--accent-primary)' : undefined,
              }}
            >
              <div className="meal-name">❌ Sin asignar</div>
            </div>
            
            {platosFiltrados.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {search ? `No hay platos que coincidan con "${search}"` : `No hay platos de ${momento}`}
                {!showAll && otrosPlatos > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAll(true)}>
                      Ver otros platos ({otrosPlatos})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              platosFiltrados.map(plato => (
                <div
                  key={plato.id}
                  className="meal-slot"
                  onClick={() => handleSelect(plato)}
                  style={{
                    marginBottom: '8px',
                    background: selectedPlato === plato.id ? 'rgba(99, 102, 241, 0.2)' : undefined,
                    border: selectedPlato === plato.id ? '1px solid var(--accent-primary)' : undefined,
                  }}
                >
                  <div className="meal-name">
                    {plato.nombre}
                    {showAll && plato.momento_dia !== momento && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '0.8rem', 
                        opacity: 0.7 
                      }}>
                        ({plato.momento_dia})
                      </span>
                    )}
                  </div>
                  <div className="meal-calories">
                    {Math.round(plato.calorias_totales)} kcal | 
                    {Math.round(plato.proteinas_totales)}g prot | 
                    {Math.round(plato.carbohidratos_totales)}g carb
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}


function Planificador() {
  const [familiares, setFamiliares] = useState([]);
  const [selectedFamiliar, setSelectedFamiliar] = useState(null);
  const [semanaInicio, setSemanaInicio] = useState(getMonday());
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    loadFamiliares();
  }, []);

  useEffect(() => {
    if (selectedFamiliar) {
      loadResumen();
    }
  }, [selectedFamiliar, semanaInicio]);

  async function loadFamiliares() {
    try {
      const data = await api.familiares.listActivos();
      setFamiliares(data);
      if (data.length > 0 && !selectedFamiliar) {
        setSelectedFamiliar(data[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadResumen() {
    try {
      const data = await api.planificacion.resumen(
        selectedFamiliar,
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
      platoActual: comida?.plato_id || null,
    });
  }

  async function handleSavePlanificacion(platoId) {
    try {
      await api.planificacion.create({
        semana_inicio: formatDate(semanaInicio),
        dia: modalData.dia,
        momento: modalData.momento,
        plato_id: platoId,
        familiar_id: selectedFamiliar,
      });
      setModalData(null);
      loadResumen();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (familiares.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👨‍👩‍👧‍👦</div>
        <h3 className="empty-state-title">No hay familiares</h3>
        <p>Primero añade familiares para poder planificar</p>
      </div>
    );
  }

  const totalSemanal = resumen?.dias?.reduce((acc, d) => acc + d.calorias_totales, 0) || 0;
  const objetivoSemanal = (resumen?.objetivo_calorias || 2000) * 7;
  const porcentaje = Math.round((totalSemanal / objetivoSemanal) * 100);

  return (
    <div>
      <header className="page-header">
        <div className="flex flex-between flex-center">
          <div>
            <h1 className="page-title">📅 Planificador Semanal</h1>
            <p className="page-subtitle">Organiza las comidas de la semana</p>
          </div>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="flex flex-between flex-center gap-4" style={{ flexWrap: 'wrap' }}>
          <div className="flex gap-4 flex-center">
            <label className="form-label" style={{ margin: 0 }}>Familiar:</label>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={selectedFamiliar || ''}
              onChange={e => setSelectedFamiliar(parseInt(e.target.value))}
            >
              {familiares.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 flex-center">
            <button className="btn btn-secondary btn-sm" onClick={prevWeek}>
              ← Anterior
            </button>
            <span style={{ minWidth: '200px', textAlign: 'center', fontWeight: '600' }}>
              Semana del {semanaInicio.toLocaleDateString('es-ES', { 
                day: 'numeric', month: 'long' 
              })}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={nextWeek}>
              Siguiente →
            </button>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Progreso semanal
            </div>
            <div style={{ fontWeight: '600', color: porcentaje > 100 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
              {totalSemanal.toFixed(0)} / {objetivoSemanal} kcal ({porcentaje}%)
            </div>
          </div>
        </div>
      </div>

      <div className="week-grid">
        {DIAS.map(dia => {
          const diaData = resumen?.dias?.find(d => d.dia === dia) || {
            calorias_totales: 0,
            comidas: []
          };
          const objetivo = resumen?.objetivo_calorias || 2000;
          const cumplido = diaData.calorias_totales >= objetivo * 0.9;

          return (
            <div key={dia} className="day-card">
              <div className="day-header">
                <span>{DIAS_DISPLAY[dia]}</span>
                <span className="day-total" style={{ 
                  color: cumplido ? 'var(--accent-success)' : 'var(--text-muted)' 
                }}>
                  {diaData.calorias_totales.toFixed(0)} kcal
                </span>
              </div>

              {MOMENTOS.map(momento => {
                const comida = diaData.comidas.find(c => c.momento === momento);
                
                return (
                  <div
                    key={momento}
                    className={`meal-slot ${!comida ? 'meal-slot-empty' : ''}`}
                    onClick={() => openModal(dia, momento)}
                  >
                    <div className="meal-moment">{momento}</div>
                    {comida ? (
                      <>
                        <div className="meal-name">{comida.plato_nombre}</div>
                        <div className="meal-calories">{Math.round(comida.calorias)} kcal</div>
                      </>
                    ) : (
                      <div style={{ padding: '8px 0' }}>+ Añadir</div>
                    )}
                  </div>
                );
              })}

              <div style={{ 
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                <div>🥩 {diaData.proteinas_totales?.toFixed(0) || 0}g prot</div>
                <div>🍞 {diaData.carbohidratos_totales?.toFixed(0) || 0}g carb</div>
                <div>🥑 {diaData.grasas_totales?.toFixed(0) || 0}g grasas</div>
              </div>
            </div>
          );
        })}
      </div>

      {modalData && (
        <AsignarPlatoModal
          dia={modalData.dia}
          momento={modalData.momento}
          familiarId={selectedFamiliar}
          platoActual={modalData.platoActual}
          onClose={() => setModalData(null)}
          onSave={handleSavePlanificacion}
        />
      )}
    </div>
  );
}

export default Planificador;
