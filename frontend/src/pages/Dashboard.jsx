import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

function Dashboard() {
  const navigate = useNavigate();
  const isAdmin = api.auth.isAdmin();
  const user = api.auth.getUser();
  const [stats, setStats] = useState({
    ingredientes: 0,
    platos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [platosRecientes, setPlatosRecientes] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ingredientes, platos] = await Promise.all([
        api.ingredientes.list(),
        api.platos.list(),
      ]);
      
      setStats({
        ingredientes: ingredientes.length,
        platos: platos.length,
      });
      setPlatosRecientes(platos.slice(0, 6));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">¡Hola, {user?.nombre || 'Usuario'}! 👋</h1>
        <p className="page-subtitle">
          {isAdmin 
            ? 'Panel de administración de NutriOrxata' 
            : 'Bienvenido al planificador de comidas familiar'}
        </p>
      </header>

      {isAdmin ? (
        <>
          <div className="grid grid-3 mb-4">
            <div className="card" onClick={() => navigate('/ingredientes')} style={{ cursor: 'pointer' }}>
              <div className="stat-item">
                <div className="stat-icon">📦</div>
                <div className="stat-value">{stats.ingredientes}</div>
                <div className="stat-label">Ingredientes</div>
              </div>
            </div>
            <div className="card" onClick={() => navigate('/platos')} style={{ cursor: 'pointer' }}>
              <div className="stat-item">
                <div className="stat-icon">🍽️</div>
                <div className="stat-value">{stats.platos}</div>
                <div className="stat-label">Platos</div>
              </div>
            </div>
            <div className="card" onClick={() => navigate('/planificador')} style={{ cursor: 'pointer' }}>
              <div className="stat-item">
                <div className="stat-icon">📅</div>
                <div className="stat-value">7</div>
                <div className="stat-label">Días planificables</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🍽️ Platos Disponibles</h3>
            </div>
            {platosRecientes.length === 0 ? (
              <p className="text-muted">No hay platos creados</p>
            ) : (
              <div className="grid grid-3">
                {platosRecientes.map(p => (
                  <div key={p.id} style={{
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--border-radius)',
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{p.nombre}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {(Array.isArray(p.momentos_dia) && p.momentos_dia.length ? p.momentos_dia : (p.momento_dia ? [p.momento_dia] : [])).map(momento => (
                        <span key={momento} className="badge badge-primary" style={{ marginRight: '6px' }}>
                          {momento}
                        </span>
                      ))}
                      <span style={{ marginLeft: '8px' }}>{Math.round(p.calorias_totales)} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>📅</div>
          <h2 style={{ marginBottom: '16px' }}>Tu Planificador Semanal</h2>
          <p className="text-muted" style={{ marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Accede al planificador para ver y organizar las comidas de la semana para toda la familia.
          </p>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/planificador')}
          >
            Ir al Planificador →
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
