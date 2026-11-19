// ==========================================
// CONFIGURACIÓN DE GEMINI (SOLO DEMO LOCAL)
// ==========================================
const GEMINI_API_KEY = "INSERTAR API KEY";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`;
const CONTEXTO_PROYECTO = `
Eres el asistente virtual de demostración de "Rescate Delta" (Equipo 5 del proyecto académico Operación Nexo).
Tu trabajo es responder preguntas breves, claras y directas sobre la plataforma.

Información clave del proyecto:
- Qué es: Plataforma web para coordinar recursos de emergencia, suministros médicos y apoyo humanitario.
- Módulos:
  1. Solicitudes y existencias: registro de necesidades en campo y consulta de lotes/caducidad.
  2. Priorización y despacho: estima riesgo de desabasto y recomienda el centro más apto usando reglas heurísticas y búsqueda (como A*).
  3. Confirmación y conciliación: reservas exclusivas, salida de inventario y bitácora de auditoría.
- Arquitectura: Híbrida en la nube. Usa SQL (principios ACID y bloqueos pesimistas SELECT ... FOR UPDATE) para evitar dobles reservas del último lote, y NoSQL para la bitácora inmutable de auditoría.
- Roles: Operador (registra solicitudes), Supervisor (revisa recomendaciones y autoriza salidas) y Auditor (consulta la bitácora).
- IA Responsable: La IA solo recomienda rutas y prioriza; nunca despacha automáticamente. La decisión final siempre es humana (Supervisor).
- Prueba de defensa: Si dos centros solicitan al mismo tiempo el último lote y uno reintenta, solo queda una reserva válida y se registran los 3 intentos en la bitácora.

Reglas de respuesta:
- Responde en español, en máximo 3 o 4 líneas.
- Si te preguntan algo fuera del proyecto, indica amablemente que solo eres un asistente de demostración de Rescate Delta.
`;

// ==========================================
// INYECCIÓN DEL BOTÓN Y MINI CHAT EN EL DOM
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const widgetHTML = `
    <button id="chat-fab" class="chat-fab" title="Asistente Rescate Delta">💬</button>

    <div id="chat-widget" class="chat-widget">
      <div class="chat-header">
        <span>Asistente Rescate Delta</span>
        <button id="chat-close" class="chat-close">&times;</button>
      </div>
      <div id="chat-messages" class="chat-messages">
        <div class="chat-msg bot">
          ¡Hola! Soy el asistente de demo de <strong>Rescate Delta</strong>. Pregúntame sobre los módulos, roles o cómo evitamos dobles reservas.
        </div>
      </div>
      <form id="chat-form" class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Escribe tu pregunta..." autocomplete="off" required />
        <button type="submit" id="chat-send">Enviar</button>
      </form>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", widgetHTML);

  const fab = document.getElementById("chat-fab");
  const widget = document.getElementById("chat-widget");
  const closeBtn = document.getElementById("chat-close");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const messages = document.getElementById("chat-messages");

  fab.addEventListener("click", () => widget.classList.toggle("abierto"));
  closeBtn.addEventListener("click", () => widget.classList.remove("abierto"));

  function agregarMensaje(texto, tipo) {
    const div = document.createElement("div");
    div.className = `chat-msg ${tipo}`;
    div.textContent = texto;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pregunta = input.value.trim();
    if (!pregunta) return;

    agregarMensaje(pregunta, "user");
    input.value = "";
    sendBtn.disabled = true;

    const cargando = agregarMensaje("Pensando...", "bot");

    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            system_instruction: {
                parts: [{ text: CONTEXTO_PROYECTO }]
            },
            contents: [
                { role: "user", parts: [{ text: pregunta }] }
            ],
            generationConfig: {
                maxOutputTokens: 200,
                temperature: 0.4
            }
            })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Error al conectar con Gemini");
      }

      const respuestaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "No pude generar una respuesta en este momento.";
      cargando.textContent = respuestaTexto;
    } catch (error) {
      cargando.textContent = "Error: verifica tu API Key o conexión a internet.";
      console.error(error);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });
});