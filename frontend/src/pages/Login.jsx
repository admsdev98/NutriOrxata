import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await api.auth.login(form.email, form.password);
        navigate('/dashboard');
      } else {
        if (form.password !== form.confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        await api.auth.register({
          nombre: form.nombre,
          email: form.email,
          password: form.password
        });
        // Auto login after register or ask to login
        await api.auth.login(form.email, form.password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar Image - Desktop Only */}
      <div className="side-hidden" style={{
        flex: 1,
        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
          zIndex: 1
        }} />
        <div style={{ position: 'relative', zIndex: 2, color: 'white', maxWidth: '400px', padding: '40px' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '24px', fontWeight: 800 }}>NutriOrxata</h1>
          <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>
            La plataforma definitiva para gestionar tu nutrición y entrenamiento.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        background: 'var(--bg-app)'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div className="text-center mb-4">
            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>
              {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? 'Ingresa tus datos para acceder' : 'Empieza tu viaje saludable hoy'}
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-input)', 
            padding: '4px', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '32px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: isLogin ? 'var(--bg-card)' : 'transparent',
                color: isLogin ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: isLogin ? 'var(--shadow-sm)' : 'none',
                fontWeight: isLogin ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: !isLogin ? 'var(--bg-card)' : 'transparent',
                color: !isLogin ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none',
                fontWeight: !isLogin ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Registrarse
            </button>
          </div>

          <div className="card">
            {error && (
              <div className="badge badge-error" style={{ width: '100%', padding: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Juan Pérez"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="hola@ejemplo.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Confirmar contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-full" 
                style={{ marginTop: '16px', padding: '14px' }}
                disabled={loading}
              >
                {loading ? 'Procesando...' : (isLogin ? 'Acceder' : 'Crear Cuenta')}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 900px) {
          .side-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
