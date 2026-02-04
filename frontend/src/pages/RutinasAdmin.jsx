import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function RutinasAdmin() {
    const navigate = useNavigate();
    const [rutinas] = useState([
        { id: 1, nombre: 'Full Body Inciación', dias: 3, nivel: 'Principiante' },
        { id: 2, nombre: 'Torso/Pierna Hipertrofia', dias: 4, nivel: 'Intermedio' },
        { id: 3, nombre: 'Fuerza 5x5', dias: 3, nivel: 'Avanzado' },
    ]);

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="page-title">Gestión de Rutinas</h1>
                    <p className="page-subtitle">Crea y asigna planes de entrenamiento</p>
                </div>
                <button className="btn btn-primary">+ Nueva Rutina</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rutinas.map(rutina => (
                    <div key={rutina.id} className="card p-0 hover:shadow-lg transition-all cursor-pointer">
                        <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 p-6 flex items-end">
                            <h3 className="text-white font-bold text-xl">{rutina.nombre}</h3>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="badge badge-secondary">{rutina.nivel}</span>
                                <span className="text-sm text-secondary font-medium">{rutina.dias} días / semana</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-secondary btn-sm flex-1">Editar</button>
                                <button className="btn btn-outline btn-sm flex-1">Asignar</button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Add Card */}
                <div className="card border-2 border-dashed border-border flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary hover:bg-primary-50 transition-all text-secondary hover:text-primary">
                    <div className="text-4xl mb-2">+</div>
                    <div className="font-medium">Crear Nueva Rutina</div>
                </div>
            </div>
        </div>
    );
}
