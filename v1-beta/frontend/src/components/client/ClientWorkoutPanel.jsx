import { useState } from 'react';

// Mock data based on RutinasAdmin
const MOCK_RUTINAS = [
    { id: 1, nombre: 'Full Body Iniciación', dias: 3, nivel: 'Principiante', descripcion: 'Rutina ideal para empezar. 3 días a la semana trabajando todo el cuerpo.' },
    { id: 2, nombre: 'Torso/Pierna Hipertrofia', dias: 4, nivel: 'Intermedio', descripcion: 'División en torso y pierna para maximizar frecuencia.' },
    { id: 3, nombre: 'Fuerza 5x5', dias: 3, nivel: 'Avanzado', descripcion: 'Foco en fuerza básica con levantamientos compuestos.' },
    { id: 4, nombre: 'Push / Pull / Leg', dias: 6, nivel: 'Avanzado', descripcion: 'Alta frecuencia y volumen. Solo para usuarios experimentados.' },
];

function ClientWorkoutPanel({ user, onSave }) {
    const [selectedRutinaId, setSelectedRutinaId] = useState(null); // In real app, load from user
    const [saving, setSaving] = useState(false);

    // Simulate loading current routine (could be passed in user prop in real app)
    // useEffect(() => { if (user.rutinaId) setSelectedRutinaId(user.rutinaId) }, [user]);

    const handleAssign = async (rutinaId) => {
        setSaving(true);
        // Simulate API call
        setTimeout(() => {
            setSelectedRutinaId(rutinaId);
            setSaving(false);
            if (onSave) onSave(); // Should trigger a re-fetch or notification
            alert('Rutina asignada correctamente');
        }, 800);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border">
                <div>
                    <h3 className="font-bold text-lg">Asignación de Entrenamiento</h3>
                    <div className="text-secondary text-sm">Selecciona una rutina para {user.nombre}</div>
                </div>
                {selectedRutinaId && (
                     <div className="badge badge-primary px-4 py-2 text-sm">
                        Rutina Actual: {MOCK_RUTINAS.find(r => r.id === selectedRutinaId)?.nombre}
                     </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_RUTINAS.map(rutina => {
                    const isActive = selectedRutinaId === rutina.id;
                    return (
                        <div 
                            key={rutina.id} 
                            className={`card p-0 overflow-hidden transition-all hover:shadow-lg border-2 
                                ${isActive ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent hover:border-primary-200'}`}
                        >
                            <div className="h-24 bg-gradient-to-br from-primary-400 to-primary-600 p-4 flex items-end">
                                <h3 className="text-white font-bold text-lg">{rutina.nombre}</h3>
                            </div>
                            <div className="p-4 flex flex-col h-[calc(100%-6rem)]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="badge badge-secondary">{rutina.nivel}</span>
                                    <span className="text-xs font-bold text-secondary">{rutina.dias} días/sem</span>
                                </div>
                                <p className="text-secondary text-sm mb-4 flex-1">{rutina.descripcion}</p>
                                
                                <button 
                                    onClick={() => handleAssign(rutina.id)}
                                    disabled={saving || isActive}
                                    className={`btn w-full ${isActive ? 'btn-ghost text-primary border-primary-200 bg-primary-50' : 'btn-outline'}`}
                                >
                                    {saving && !isActive ? 'Asignando...' : isActive ? 'Asignada' : 'Seleccionar Rutina'}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Custom/New Placeholder */}
                <div className="card border-2 border-dashed border-border flex flex-col items-center justify-center p-8 text-center min-h-[250px] opacity-60">
                    <div className="text-3xl mb-2">En desarrollo</div>
                    <div className="font-bold text-secondary">Diseñador Personalizado</div>
                    <p className="text-xs text-secondary mt-1">Próximamente podrás crear rutinas personalizadas desde cero para este cliente.</p>
                </div>
            </div>
        </div>
    );
}

export default ClientWorkoutPanel;
