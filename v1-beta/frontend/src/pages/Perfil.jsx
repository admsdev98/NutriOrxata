import { useState } from 'react';
import api from '../api/client';

export default function Perfil() {
  const user = api.auth.getUser();
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Mi Perfil</h1>
      </div>

      <div className="grid grid-3">
        {/* Sidebar Info */}
        <div className="card text-center">
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 24px' }}>
                {user?.nombre?.[0] || 'U'}
            </div>
            <h2 className="card-title">{user?.nombre || 'Usuario Demo'}</h2>
            <p className="text-secondary mb-4">{user?.email}</p>
            <div className="badge badge-success mb-4">Plan Activo</div>
        </div>

        {/* Main Settings */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
           <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '24px', display: 'flex', gap: '24px' }}>
              <button 
                className={`pb-2 ${activeTab === 'personal' ? 'text-primary border-b-2 border-primary' : 'text-secondary'}`}
                style={{ borderBottom: activeTab === 'personal' ? '2px solid var(--primary-500)' : 'none', color: activeTab === 'personal' ? 'var(--primary-500)' : 'inherit', fontWeight: 600, background: 'none', border: 'none', paddingBottom: '8px', cursor: 'pointer' }}
                onClick={() => setActiveTab('personal')}
              >
                  Datos Personales
              </button>
              <button 
                className={`pb-2 ${activeTab === 'fisico' ? 'text-primary border-b-2 border-primary' : 'text-secondary'}`}
                style={{ borderBottom: activeTab === 'fisico' ? '2px solid var(--primary-500)' : 'none', color: activeTab === 'fisico' ? 'var(--primary-500)' : 'inherit', fontWeight: 600, background: 'none', border: 'none', paddingBottom: '8px', cursor: 'pointer' }}
                onClick={() => setActiveTab('fisico')}
              >
                  Datos Físicos
              </button>
           </div>

           {activeTab === 'personal' && (
               <form className="animate-fade-in">
                   <div className="grid grid-2">
                       <div className="form-group">
                           <label className="form-label">Nombre Completo</label>
                           <input type="text" className="form-input" defaultValue={user?.nombre} />
                       </div>
                       <div className="form-group">
                           <label className="form-label">Email</label>
                           <input type="email" className="form-input" defaultValue={user?.email} disabled />
                       </div>
                       <div className="form-group">
                           <label className="form-label">Teléfono</label>
                           <input type="tel" className="form-input" placeholder="+34 600..." />
                       </div>
                   </div>
                   <button className="btn btn-primary mt-4">Guardar Cambios</button>
               </form>
           )}

           {activeTab === 'fisico' && (
               <form className="animate-fade-in">
                   <div className="grid grid-2">
                       <div className="form-group">
                           <label className="form-label">Peso (kg)</label>
                           <input type="number" className="form-input" defaultValue="75" />
                       </div>
                       <div className="form-group">
                           <label className="form-label">Altura (cm)</label>
                           <input type="number" className="form-input" defaultValue="180" />
                       </div>
                       <div className="form-group">
                           <label className="form-label">Objetivo</label>
                           <select className="form-select">
                               <option>Mantenimiento</option>
                               <option>Pérdida de Grasa</option>
                               <option>Ganancia Muscular</option>
                           </select>
                       </div>
                       <div className="form-group">
                           <label className="form-label">Nivel de Actividad</label>
                           <select className="form-select">
                               <option>Sedentario</option>
                               <option>Ligeramente Activo</option>
                               <option>Muy Activo</option>
                           </select>
                       </div>
                   </div>
                   <button className="btn btn-primary mt-4">Actualizar Datos</button>
               </form>
           )}
        </div>
      </div>
    </div>
  );
}
