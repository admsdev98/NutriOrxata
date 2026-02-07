import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import ClientProfilePanel from '../components/client/ClientProfilePanel';
import ClientWorkoutPanel from '../components/client/ClientWorkoutPanel';

function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // profile, workout

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    setLoading(true);
    try {
      // We don't have a direct get(id) yet in our limited API wrapper for non-me users, 
      // but we can use listUsers with a filter or we can assume we need to implement it.
      // For now, let's try to filter from listUsers since that is what we have verified.
      // Ideally, backend should support /api/auth/usuarios/:id
      // Let's assume api.auth.listUsers({ search: ... }) or assume we can hack it for now, 
      // but the clean way is to ensure we can get one user. 
      // Checking api.client.js again:
      /*
        listUsers: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return request(`/api/auth/usuarios${query ? `?${query}` : ''}`);
        },
      */
      // We'll try to get data by listing. If specific ID endpoint existed, we'd use it.
      // Actually, looking at the previous file content for api.client.js:
      // It DOES NOT have specific get by ID for users. 
      // However, we can probably just use listUsers and filter in client side as fallback, 
      // or assume the backend supports filtering by ID if we pass it? 
      // Let's try to fetch all (or searchable) and find it. 
      // *Wait*, we can add a specific get to the API client if needed, but let's stick to what we have.
      // We will perform a search by ID if the backend supports it, or just fetch list.
      // Let's assume we can fetch list and find.
      // Actually, looking at `api.auth.getUser()`, that's local.
      
      const response = await api.auth.listUsers({ limit: 1000 }); // Get all for now to be safe
      const found = response.items.find(u => u.id === parseInt(id));
      
      if (found) {
        setUser(found);
      } else {
        alert('Usuario no encontrado');
        navigate('/usuarios');
      }
    } catch (err) {
      console.error(err);
      alert('Error cargando usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
     if(!confirm('¿Eliminar usuario irreversiblemente?')) return;
     try {
         await api.auth.deleteUser(user.id);
         navigate('/usuarios');
     } catch(e) { alert(e.message); }
  };

  const toggleActive = async () => {
      try {
          await api.auth.updateUser(user.id, { activo: !user.activo });
          loadUser();
      } catch(e) { alert(e.message); }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="spinner"></div>
        </div>
    );
  }

  if (!user) return null;

  return (
    <div className="animate-fade-in w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
             <button onClick={() => navigate('/usuarios')} className="btn btn-icon bg-white border border-border">
                ←
             </button>
             <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-3xl font-bold">
                {user.nombre?.[0]}
             </div>
             <div>
                <h1 className="text-3xl font-bold text-main">{user.nombre} {user.apellidos}</h1>
                <div className="flex gap-2 items-center text-secondary text-sm">
                    <span>{user.email}</span>
                    <span>•</span>
                    <span className={`badge ${user.activo ? 'badge-success' : 'badge-error'}`}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <span>•</span>
                    <span className="badge badge-primary">{user.objetivo || 'Sin objetivo'}</span>
                </div>
             </div>
        </div>
        
        <div className="flex gap-2 self-end md:self-auto">
             <button onClick={toggleActive} className="btn btn-secondary">
                 {user.activo ? 'Desactivar' : 'Activar'}
             </button>
             <button onClick={handleDelete} className="btn btn-danger">
                 Eliminar
             </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto no-scrollbar">
          <button 
             className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-primary-500 text-primary-500' : 'border-transparent text-secondary hover:text-main'}`}
             onClick={() => setActiveTab('profile')}
          >
             Perfil y datos
          </button>
          <button 
             className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'nutrition' ? 'border-primary-500 text-primary-500' : 'border-transparent text-secondary hover:text-main'}`}
              onClick={() => navigate(`/plan-nutricional?clientId=${user.id}`)}
          >
             Plan nutricional
          </button>
          <button 
             className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'workout' ? 'border-primary-500 text-primary-500' : 'border-transparent text-secondary hover:text-main'}`}
             onClick={() => setActiveTab('workout')}
          >
             Entrenamiento
          </button>
      </div>

      {/* CONTENT */}
      <div className="min-h-[500px]">
          {activeTab === 'profile' && <ClientProfilePanel user={user} onSave={loadUser} />}
          {activeTab === 'workout' && <ClientWorkoutPanel user={user} onSave={loadUser} />}
      </div>
    </div>
  );
}

export default ClienteDetalle;
