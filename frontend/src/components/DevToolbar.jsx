import { useState, useEffect } from 'react';
import api from '../api/client';

export default function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [backupUser, setBackupUser] = useState(null);

  useEffect(() => {
    // Check if we are currently logged in
    const user = api.auth.getUser();
    setCurrentUser(user);
    
    // Check if we have a backup (impersonating)
    // Note: Since api/client.js manages localStorage, we read localStorage directly for backup
    // to avoid polluting the main api file with dev-only logic if possible, 
    // or just use localStorage directly here as per plan.
    const backup = localStorage.getItem('nutriorxata_dev_admin_backup');
    if (backup) {
      setBackupUser(JSON.parse(backup));
    }

    // Load clients if we are admin or if we want to allow switching FROM a client back to other clients (optional)
    // Only admins should see the list to switch.
    if (user?.rol === 'admin') {
      loadClients();
    }
  }, []);

  const loadClients = async () => {
    try {
      const res = await api.auth.listUsers({ rol: 'cliente' });
      setClients(res.items || []);
    } catch (e) {
      console.error("DevToolbar failed to list clients:", e);
    }
  };

  const activeUser = api.auth.getUser();

  const handleSwitchToClient = (client) => {
    if (!confirm(`¿Cambiar vista a usuario: ${client.nombre}?`)) return;

    // 1. Backup current admin user if not already backed up
    if (!backupUser) {
        localStorage.setItem('nutriorxata_dev_admin_backup', JSON.stringify(activeUser));
    }
    
    // 2. Set new user in localStorage
    // We keep the SAME token because backend might not validate ownership for all GETs, 
    // or we assume this is purely for UI testing. 
    // If backend validates token.userId vs requested resource, this might fail for some calls.
    // The user explicitly asked for "local" toggling effectively "mocking" the user.
    localStorage.setItem('nutriorxata_user', JSON.stringify(client));
    
    // 3. Reload
    window.location.reload();
  };

  const handleRestoreAdmin = () => {
    if (!backupUser) return;

    // 1. Restore admin
    localStorage.setItem('nutriorxata_user', JSON.stringify(backupUser));
    
    // 2. Clear backup
    localStorage.removeItem('nutriorxata_dev_admin_backup');
    
    // 3. Reload
    window.location.reload();
  };

  // if (!activeUser) return null; // Debugging: Always render

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition"
        title="Dev Tools"
      >
        🛠️
      </button>

      {/* Toolbar Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-fade-in-up">
          <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
            Dev Tools
            <button onClick={() => setIsOpen(false)} className="text-lg leading-none">&times;</button>
          </div>
          
          <div className="p-4 space-y-4">
            
            {/* Current User Info */}
            <div>
               <div className="text-xs text-secondary mb-1">Usuario Actual:</div>
               <div className="font-bold text-sm truncate bg-gray-50 p-2 rounded border border-gray-100">
                 {activeUser?.nombre || 'No identificado'} ({activeUser?.rol || 'N/A'})
               </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
                {backupUser ? (
                    <button 
                        onClick={handleRestoreAdmin}
                        className="w-full btn btn-primary btn-sm flex items-center justify-center gap-2"
                    >
                        🔙 Restaurar Admin
                    </button>
                ) : (
                   activeUser?.rol === 'admin' ? (
                       <div>
                           <div className="text-xs text-secondary mb-2">Cambiar vista a cliente:</div>
                           <div className="max-h-40 overflow-y-auto space-y-1 border rounded p-1">
                               {clients.length === 0 && <div className="text-xs text-gray-400 p-2">No hay clientes</div>}
                               {clients.map(c => (
                                   <button 
                                       key={c.id}
                                       onClick={() => handleSwitchToClient(c)}
                                       className="w-full text-left text-xs p-2 hover:bg-blue-50 rounded flex items-center gap-2 truncate"
                                   >
                                       <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                       {c.nombre}
                                   </button>
                               ))}
                           </div>
                       </div>
                   ) : (
                       <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded">
                           ⚠️ Estás en modo Cliente sin backup. Inicia sesión como Admin primero.
                       </div>
                   )
                )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
