import { useState } from 'react';

export default function Entrenamiento() {
  const [activeRoutine, setActiveRoutine] = useState(null);
  
  // Mock Routines Data
  const routines = [
    { 
        id: 'push', 
        name: 'Día 1: Empuje (Push)', 
        focus: 'Pecho, Hombros, Tríceps',
        exercises: [
            { id: 1, name: 'Press Banca', sets: 4, reps: 8, weight: 60, bodyPart: 'Pecho' },
            { id: 2, name: 'Press Militar', sets: 4, reps: 10, weight: 40, bodyPart: 'Hombros' },
            { id: 3, name: 'Fondos en Paralelas', sets: 3, reps: 12, weight: 0, bodyPart: 'Tríceps' },
        ]
    },
    { 
        id: 'pull', 
        name: 'Día 2: Tracción (Pull)', 
        focus: 'Espalda, Bíceps',
        exercises: [
            { id: 4, name: 'Remo con Barra', sets: 4, reps: 8, weight: 70, bodyPart: 'Espalda' },
            { id: 5, name: 'Dominadas', sets: 3, reps: 10, weight: 0, bodyPart: 'Espalda' },
            { id: 6, name: 'Curl con Barra', sets: 3, reps: 12, weight: 30, bodyPart: 'Bíceps' },
        ]
    },
    { 
        id: 'legs', 
        name: 'Día 3: Pierna (Legs)', 
        focus: 'Cuádriceps, Femoral',
        exercises: [
            { id: 7, name: 'Sentadilla con Barra', sets: 4, reps: 8, weight: 100, bodyPart: 'Pierna' },
            { id: 8, name: 'Peso Muerto Rumano', sets: 3, reps: 10, weight: 90, bodyPart: 'Pierna' },
            { id: 9, name: 'Prensa de Piernas', sets: 3, reps: 15, weight: 150, bodyPart: 'Pierna' },
        ]
    }
  ];

  /* --- VIEW: ROUTINE SELECTION --- */
  if (!activeRoutine) {
    return (
      <div className="animate-fade-in">
        <header className="page-header mb-8">
            <h1 className="page-title">Tu Plan de Entrenamiento</h1>
            <p className="page-subtitle">Selecciona la rutina que quieres entrenar hoy</p>
        </header>

        <div className="grid grid-1 md:grid-2 gap-6">
            {routines.map(routine => (
                <div 
                   key={routine.id} 
                   className="card cursor-pointer hover:shadow-lg hover:border-primary transition-all group"
                   onClick={() => setActiveRoutine(routine)}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                           Plan
                        </div>
                        <button className="btn btn-ghost btn-sm text-primary group-hover:underline">Empezar →</button>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{routine.name}</h3>
                    <p className="text-secondary text-sm mb-4">Enfoque: {routine.focus}</p>
                    
                    <div className="flex gap-2 text-xs font-bold text-secondary uppercase tracking-wider">
                        <span className="bg-gray-100 px-2 py-1 rounded">{routine.exercises.length} Ejercicios</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">~60 Min</span>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
             <span className="text-2xl">Nota</span>
             <div>
                  <h4 className="font-bold text-yellow-800">Consejo del Coach</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                      No te saltes el calentamiento. Realiza 5-10 minutos de movilidad antes de empezar con las series efectivas.
                  </p>
              </div>
        </div>
      </div>
    );
  }

  /* --- VIEW: ACTIVE WORKOUT --- */
  return (
    <div className="animate-fade-in">
      <div className="page-header flex justify-between items-center sticky top-0 bg-white z-10 py-4 border-b border-gray-100 mb-6">
        <div>
          <button 
             onClick={() => setActiveRoutine(null)}
             className="text-sm font-bold text-secondary hover:text-black mb-1 flex items-center gap-1"
          >
             ← Volver
          </button>
          <h1 className="page-title text-2xl">{activeRoutine.name}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { alert('¡Entrenamiento Guardado!'); setActiveRoutine(null); }}>
          Terminar
        </button>
      </div>

      <div className="grid grid-1 gap-6 pb-20">
        {activeRoutine.exercises.map((ex, index) => (
          <div key={ex.id} className="card">
            <div className="card-header border-b border-gray-50 pb-3 mb-3">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                 </div>
                 <div>
                    <h3 className="card-title text-lg">{ex.name}</h3>
                    <div className="text-xs font-bold text-secondary uppercase tracking-wider">{ex.bodyPart}</div>
                 </div>
              </div>
            </div>
            
            <div className="grid grid-3 gap-2 mb-4 bg-gray-50 p-3 rounded-lg text-center">
               <div>
                  <div className="text-secondary text-xs font-bold uppercase">Series</div>
                  <div className="font-bold text-lg">{ex.sets}</div>
               </div>
               <div>
                  <div className="text-secondary text-xs font-bold uppercase">Reps Obj.</div>
                  <div className="font-bold text-lg">{ex.reps}</div>
               </div>
               <div>
                  <div className="text-secondary text-xs font-bold uppercase">Peso Obj.</div>
                  <div className="font-bold text-lg">{ex.weight} kg</div>
               </div>
            </div>

            {/* Input Rows for Sets */}
            <div className="flex flex-col gap-2">
               {Array.from({ length: ex.sets }).map((_, i) => (
                   <div key={i} className="flex items-center gap-2">
                       <span className="w-6 text-xs font-bold text-secondary text-right">{i + 1}</span>
                       <input type="number" placeholder={ex.weight} className="form-input py-1 text-sm text-center" />
                       <span className="text-xs text-secondary">kg</span>
                       <input type="number" placeholder={ex.reps} className="form-input py-1 text-sm text-center" />
                       <span className="text-xs text-secondary">reps</span>
                        <button type="button" className="w-8 h-8 rounded bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-colors">
                           OK
                        </button>
                   </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
