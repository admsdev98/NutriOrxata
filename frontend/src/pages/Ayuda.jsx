export default function Ayuda() {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Ayuda y Soporte</h1>
          <p className="page-subtitle">Resuelve tus dudas sobre la plataforma</p>
        </div>
  
        <div className="grid grid-2">
          <div className="card">
              <h2 className="card-title mb-4">Preguntas Frecuentes</h2>
              
              <div className="space-y-4">
                  <details style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px' }}>
                      <summary style={{ fontWeight: 600, cursor: 'pointer' }}>¿Cómo puedo cambiar mi plan de comidas?</summary>
                      <p className="mt-4 text-secondary text-sm pt-2 border-t border-gray-100">
                          Tu plan de comidas es asignado por tu nutricionista. Si necesitas cambios por alergias o preferencias, envíale un mensaje directo o solicita una cita.
                      </p>
                  </details>
  
                  <details style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px' }}>
                      <summary style={{ fontWeight: 600, cursor: 'pointer' }}>¿Cómo registro mis entrenamientos?</summary>
                      <p className="mt-4 text-secondary text-sm pt-2 border-t border-gray-100">
                          Ve a la sección "Entrenamiento", selecciona la rutina del día y rellena los campos de peso y repeticiones. Al finalizar, pulsa "Completar entrenamiento".
                      </p>
                  </details>
  
                  <details style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px' }}>
                      <summary style={{ fontWeight: 600, cursor: 'pointer' }}>¿Cómo contacto a mi entrenador?</summary>
                      <p className="mt-4 text-secondary text-sm pt-2 border-t border-gray-100">
                          Puedes usar el formulario de contacto en esta misma página o enviar un email a soporte@nutriorxata.com.
                      </p>
                  </details>
              </div>
          </div>
  
          <div className="card">
              <h2 className="card-title mb-4">Contactar Soporte</h2>
              <form>
                  <div className="form-group">
                      <label className="form-label">Asunto</label>
                      <select className="form-select">
                          <option>Duda sobre mi plan</option>
                          <option>Problema técnico</option>
                          <option>Facturación</option>
                          <option>Otro</option>
                      </select>
                  </div>
                  <div className="form-group">
                      <label className="form-label">Mensaje</label>
                      <textarea className="form-textarea" placeholder="Describe tu problema aquí..."></textarea>
                  </div>
                  <button className="btn btn-primary btn-full">Enviar Mensaje</button>
              </form>
          </div>
        </div>
      </div>
    );
  }
