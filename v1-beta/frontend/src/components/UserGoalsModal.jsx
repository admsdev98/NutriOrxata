import { useState, useEffect } from 'react';
import api from '../api/client';

const ACTIVITY_LABELS = {
  sedentario: 'Sedentario',
  ligero: 'Ligero',
  moderado: 'Moderado',
  activo: 'Activo',
  muy_activo: 'Muy activo',
};

const ACTIVITY_DETAILS = {
  sedentario: '0-1 dias actividad ligera',
  ligero: '1-3 dias actividad ligera',
  moderado: '3-5 dias actividad moderada',
  activo: '6-7 dias actividad intensa',
  muy_activo: 'doble sesion o trabajo fisico',
};

const ACTIVITY_MULTIPLIERS = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

function UserGoalsModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nivel_actividad: 'sedentario',
    objetivo: 'mantenimiento',
    calorias_mantenimiento: '',
    calorias_objetivo: '',
    edad: '',
    altura: '',
    peso: '',
    sexo: 'hombre',
    grasa_corporal: '',
  });
  const [formulaResults, setFormulaResults] = useState([]);

  useEffect(() => {
    if (!user) return;
    setFormData({
      nivel_actividad: user.nivel_actividad || 'sedentario',
      objetivo: user.objetivo || 'mantenimiento',
      calorias_mantenimiento: user.calorias_mantenimiento || '',
      calorias_objetivo: user.calorias_objetivo || '',
      edad: user.edad || '',
      altura: user.altura || '',
      peso: user.peso || '',
      sexo: user.sexo || 'hombre',
      grasa_corporal: user.grasa_corporal || '',
    });
  }, [user]);

  useEffect(() => {
    if (!formData.calorias_mantenimiento) return;
    const base = parseFloat(formData.calorias_mantenimiento) || 0;
    let objetivo = base;
    if (formData.objetivo === 'definicion') objetivo = base - 500;
    if (formData.objetivo === 'volumen') objetivo = base + 300;
    setFormData(prev => ({ ...prev, calorias_objetivo: objetivo }));
  }, [formData.calorias_mantenimiento, formData.objetivo]);

  function calculateSuggested() {
    if (!formData.peso || !formData.altura || !formData.edad) {
      alert('Faltan datos (peso, altura, edad) para calcular.');
      return;
    }

    const w = parseFloat(formData.peso);
    const h = parseFloat(formData.altura);
    const a = parseInt(formData.edad, 10);
    const isMale = formData.sexo === 'hombre';
    const multiplier = ACTIVITY_MULTIPLIERS[formData.nivel_actividad] || 1.2;

    let mifflin = 10 * w + 6.25 * h - 5 * a + (isMale ? 5 : -161);
    let benedict = isMale
      ? 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a)
      : 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
    let katch = null;
    const bodyFat = parseFloat(formData.grasa_corporal);
    if (!Number.isNaN(bodyFat) && bodyFat > 0 && bodyFat < 70) {
      const leanMass = w * (1 - bodyFat / 100);
      katch = 370 + (21.6 * leanMass);
    }
    let schofield;
    if (isMale) {
      if (a < 18) schofield = 17.686 * w + 658.2;
      else if (a < 30) schofield = 15.057 * w + 692.2;
      else if (a < 60) schofield = 11.472 * w + 873.1;
      else schofield = 11.711 * w + 587.7;
    } else {
      if (a < 18) schofield = 13.384 * w + 692.6;
      else if (a < 30) schofield = 14.818 * w + 486.6;
      else if (a < 60) schofield = 8.126 * w + 845.6;
      else schofield = 9.082 * w + 658.5;
    }

    const baseResults = [
      { id: 'mifflin', label: 'Mifflin-St Jeor', bmr: mifflin },
      { id: 'benedict', label: 'Harris-Benedict', bmr: benedict },
      { id: 'schofield', label: 'OMS/Schofield', bmr: schofield },
    ];
    if (katch) {
      baseResults.push({ id: 'katch', label: 'Katch-McArdle', bmr: katch });
    }

    const results = baseResults.map(item => {
      const mantenimiento = Math.round(item.bmr * multiplier);
      return {
        ...item,
        mantenimiento,
        definicion: Math.round(mantenimiento - 500),
        volumen: Math.round(mantenimiento + 300),
      };
    });

    setFormulaResults(results);
  }

  function applySuggestionValue(value) {
    if (!value) return;
    setFormData(prev => ({
      ...prev,
      calorias_mantenimiento: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.auth.updateUser(user.id, {
        nivel_actividad: formData.nivel_actividad,
        objetivo: formData.objetivo,
        calorias_mantenimiento: formData.calorias_mantenimiento ? parseFloat(formData.calorias_mantenimiento) : null,
        calorias_objetivo: formData.calorias_objetivo ? parseFloat(formData.calorias_objetivo) : null,
        edad: formData.edad ? parseInt(formData.edad, 10) : null,
        altura: formData.altura ? parseInt(formData.altura, 10) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        grasa_corporal: formData.grasa_corporal ? parseFloat(formData.grasa_corporal) : null,
        sexo: formData.sexo,
      });
      onSave();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg goals-modal">
        <div className="modal-header">
          <h3>Objetivos: {user.nombre}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body goals-body">
          <section className="goals-section">
            <div className="card goals-card panel-card">
              <div className="section-title-row">
                <div>
                  <h4 className="section-title">Calorias diarias</h4>
                  <p className="section-help">Ajusta el objetivo y calcula una sugerencia rapida.</p>
                </div>
              </div>

              <div className="grid grid-3 goals-grid">
                <div className="form-group">
                  <label className="form-label">Edad</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.edad}
                    onChange={e => setFormData({ ...formData, edad: e.target.value })}
                    placeholder="Ej: 32"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Altura (cm)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.altura}
                    onChange={e => setFormData({ ...formData, altura: e.target.value })}
                    placeholder="Ej: 175"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.peso}
                    onChange={e => setFormData({ ...formData, peso: e.target.value })}
                    placeholder="Ej: 72.5"
                  />
                </div>
              </div>

              <div className="grid grid-2 goals-grid">
                <div className="form-group">
                  <label className="form-label">Sexo</label>
                  <div className="radio-group">
                    <label className="radio-item">
                      <input
                        type="radio"
                        name="sexo"
                        value="hombre"
                        checked={formData.sexo === 'hombre'}
                        onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                      /> Hombre
                    </label>
                    <label className="radio-item">
                      <input
                        type="radio"
                        name="sexo"
                        value="mujer"
                        checked={formData.sexo === 'mujer'}
                        onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                      /> Mujer
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Grasa corporal (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.grasa_corporal}
                    onChange={e => setFormData({ ...formData, grasa_corporal: e.target.value })}
                    placeholder="Opcional"
                  />
                  <p className="form-help">Si la indicas, se usa Katch-McArdle para mayor precision.</p>
                </div>
              </div>

              <div className="grid grid-2 goals-grid">
                <div className="form-group">
                  <label className="form-label">Nivel de actividad</label>
                  <select
                    className="form-select"
                    value={formData.nivel_actividad}
                    onChange={e => setFormData({ ...formData, nivel_actividad: e.target.value })}
                  >
                    {Object.keys(ACTIVITY_LABELS).map(key => (
                      <option key={key} value={key}>{ACTIVITY_LABELS[key]} · {ACTIVITY_DETAILS[key]}</option>
                    ))}
                  </select>
                  <p className="form-help">{ACTIVITY_DETAILS[formData.nivel_actividad]}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Objetivo</label>
                  <select
                    className="form-select"
                    value={formData.objetivo}
                    onChange={e => setFormData({ ...formData, objetivo: e.target.value })}
                  >
                    <option value="mantenimiento">Mantener</option>
                    <option value="definicion">Definicion</option>
                    <option value="volumen">Volumen</option>
                  </select>
                </div>
              </div>

              <div className="goals-actions">
                <button type="button" className="btn btn-secondary" onClick={calculateSuggested}>
                  Calcular Kcal
                </button>
              </div>

              {formulaResults.length > 0 && (
                <div className="kcal-results">
                  {formulaResults.map((result, index) => (
                    <div key={result.id} className="kcal-card">
                      <div className="kcal-title">Resultado Formula {index + 1} ({result.label})</div>
                      <div className="kcal-values">
                        <div className="kcal-pill">Definicion <strong>{result.definicion} kcal</strong></div>
                        <div className="kcal-pill">Mantenimiento <strong>{result.mantenimiento} kcal</strong></div>
                        <div className="kcal-pill">Volumen <strong>{result.volumen} kcal</strong></div>
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => applySuggestionValue(result.mantenimiento)}
                        >
                          Usar esta sugerencia
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="goals-section">
            <div className="card goals-card panel-card">
              <div className="section-title-row">
                <div>
                  <h4 className="section-title">Ajuste manual</h4>
                  <p className="section-help">Edita directamente los valores finales.</p>
                </div>
              </div>

              <div className="grid grid-2 goals-grid">
                <div className="form-group">
                  <label className="form-label">Mantenimiento</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.calorias_mantenimiento}
                    onChange={e => setFormData({ ...formData, calorias_mantenimiento: e.target.value })}
                    placeholder="Ej: 2000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Objetivo final</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.calorias_objetivo}
                    onChange={e => setFormData({ ...formData, calorias_objetivo: e.target.value })}
                    placeholder="Ej: 1700"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserGoalsModal;
