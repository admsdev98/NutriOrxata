import { useState } from 'react';

const INITIAL_MESSAGES = [
  { id: 1, sender: 'Alice Johnson', text: 'Hola, ¿podemos ajustar mi plan de entrenamiento?', time: '10:30 AM', unread: true },
  { id: 2, sender: 'Bob Smith', text: '¿La ensalada césar lleva gluten?', time: '09:15 AM', unread: false },
  { id: 3, sender: 'Carol Davis', text: 'He completado mi rutina de hoy, ¡me siento genial!', time: 'Ayer', unread: false },
];

export default function Mensajes() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reply, setReply] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    // Simulate sending
    console.log('Sending reply:', reply);
    setReply('');
    alert('Mensaje enviado correctamente');
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-120px)]">
      <div className="page-header shrink-0">
        <h1 className="page-title">Centro de Mensajes</h1>
        <p className="page-subtitle">Gestiona la comunicación con tus clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Messages List */}
        <div className="card flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <h2 className="card-title mb-4">Conversaciones</h2>
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedMessage?.id === msg.id
                  ? 'bg-primary-50 border-primary ring-1 ring-primary-100'
                  : 'bg-white border-border hover:bg-input'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold">{msg.sender}</span>
                <span className="text-[10px] text-secondary">{msg.time}</span>
              </div>
              <p className="text-sm text-secondary truncate">{msg.text}</p>
              {msg.unread && (
                <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2"></span>
              )}
            </div>
          ))}
        </div>

        {/* Message Detail / Reply */}
        <div className="card md:col-span-2 flex flex-col overflow-hidden">
          {selectedMessage ? (
            <>
              <div className="card-header border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                    {selectedMessage.sender[0]}
                  </div>
                  <div>
                    <h3 className="card-title">{selectedMessage.sender}</h3>
                    <p className="text-xs text-secondary">Visto hoy a las {selectedMessage.time}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4 pr-2">
                <div className="bg-input p-4 rounded-xl rounded-tl-none max-w-[80%]">
                  <p className="text-sm">{selectedMessage.text}</p>
                </div>
                {/* Simulated replies would go here */}
              </div>

              <form onSubmit={handleSendMessage} className="mt-auto pt-4 border-t border-border flex gap-2">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Escribe tu respuesta..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Enviar</button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <div className="text-4xl mb-4">Mensajes</div>
              <h3 className="font-bold">Selecciona una conversación</h3>
              <p className="text-sm">Tus mensajes aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
