import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Landing() {
  const navigate = useNavigate();

  function scrollToPlans() {
    const el = document.getElementById('planes');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    if (api.auth.isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <div className="sidebar-logo">
            <span>NutriOrxata</span>
          </div>
          <div className="landing-nav-actions">
            <button onClick={() => navigate('/login?mode=login')} className="btn btn-ghost">Iniciar Sesión</button>
            <button onClick={() => navigate('/login?mode=register')} className="btn btn-primary">Registrarse</button>
          </div>
        </div>
      </nav>

      <div className="landing-hero animate-fade-in">
        <h1 className="landing-title">
          Nutrición inteligente <br />
          para tu mejor versión
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '32px' }}>
          Planifica tus comidas, gestiona tus entrenamientos y alcanza tus objetivos con la plataforma todo en uno para profesionales y clientes.
        </p>
        <div className="landing-cta">
          <button onClick={() => navigate('/login?mode=register')} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Empezar Gratis
          </button>
          <button onClick={scrollToPlans} className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Ver Planes
          </button>
        </div>
      </div>

      <div id="planes" className="landing-section landing-plans">
        <div className="landing-container">
          <h2 className="text-center page-title" style={{ marginBottom: '60px' }}>Planes Simples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center" style={{ borderTop: '4px solid var(--border-color)' }}>
              <h3 className="card-title">Básico</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '16px 0', color: 'var(--text-main)' }}>0€</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Para empezar a cuidarte</p>
              <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '24px', lineHeight: '2' }}>
                <li>Menú semanal básico</li>
                <li>Registro de peso</li>
                <li>1 rutina estándar</li>
              </ul>
              <button onClick={() => navigate('/login?mode=register')} className="btn btn-secondary btn-full">Seleccionar</button>
            </div>

            <div className="card text-center landing-plan-featured" style={{ borderTop: '4px solid var(--primary-500)' }}>
              <div className="badge badge-primary" style={{ marginBottom: '16px' }}>Más Popular</div>
              <h3 className="card-title">Pro</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '16px 0', color: 'var(--primary-600)' }}>29€</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Seguimiento completo</p>
              <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '24px', lineHeight: '2' }}>
                <li>Menús personalizados</li>
                <li>Gráficas de progreso</li>
                <li>Rutinas ilimitadas</li>
                <li>Chat con nutricionista</li>
              </ul>
              <button onClick={() => navigate('/login?mode=register')} className="btn btn-primary btn-full">Empezar Ahora</button>
            </div>

            <div className="card text-center" style={{ borderTop: '4px solid var(--border-color)' }}>
              <h3 className="card-title">Empresa</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '16px 0', color: 'var(--text-main)' }}>Contactar</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Para equipos grandes</p>
              <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '24px', lineHeight: '2' }}>
                <li>Gestión de múltiples clientes</li>
                <li>Panel de administración</li>
                <li>Marca blanca</li>
              </ul>
              <button onClick={() => { window.location.href = 'mailto:hola@nutriorxata.com?subject=Plan%20Empresa'; }} className="btn btn-secondary btn-full">Contactar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
