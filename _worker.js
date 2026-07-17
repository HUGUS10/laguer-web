// ============================================================
// _worker.js - LAGUER STORE
// Cloudflare Pages Worker + D1 + n8n IA (con fallback)
// ============================================================

const N8N_WEBHOOK = "https://hugolaban.app.n8n.cloud/webhook/laguer-ia";

// ============================================================
// RESPUESTAS LOCALES (fallback cuando n8n falla)
// ============================================================
const LOCAL_RESPONSES = {
  "hola": "¡Hola! 👋 Bienvenido a LAGUER. ¿En qué puedo ayudarte?",
  "productos": "Tenemos una amplia variedad de productos: Tecnología, Hogar, Deportes y Accesorios. ¿Qué categoría te interesa?",
  "pagos": "Aceptamos: Visa, Mastercard, Yape, Plin, Amex y Diners. Todos nuestros pagos son 100% seguros.",
  "envíos": "Realizamos envíos a todo el Perú con seguimiento en tiempo real. El costo varía según tu ubicación.",
  "pedido": "Para rastrear tu pedido, necesito el número de seguimiento. ¿Tienes tu código de rastreo?",
  "garantía": "Todos nuestros productos tienen garantía de autenticidad. Si tienes problemas, contáctanos.",
  "default": "Gracias por contactar a LAGUER. Puedo ayudarte con: Productos, Stock, Envíos, Pagos, Garantías y Pedidos. ¿Qué necesitas?"
};

function getLocalResponse(mensaje) {
  const text = mensaje.toLowerCase().trim();
  for (const [key, response] of Object.entries(LOCAL_RESPONSES)) {
    if (text.includes(key)) {
      return response;
    }
  }
  return LOCAL_RESPONSES.default;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // CORS
    // ============================================================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // ============================================================
    // CHAT - Con fallback local
    // ============================================================
    if (path === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        console.log("📨 Mensaje:", body.mensaje);

        if (!body.mensaje || body.mensaje.trim() === "") {
          return jsonResponse({
            respuesta: "Por favor, escribe un mensaje válido.",
            source: "local"
          });
        }

        // Intentar conectar con n8n (timeout 10 segundos)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const respuesta = await fetch(N8N_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mensaje: body.mensaje,
              historial: body.historial || [],
              pagina: "LAGUER WEB",
              cliente: "visitante",
              fecha: new Date().toISOString()
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (respuesta.ok) {
            const data = await respuesta.json();
            const botResponse = data.respuesta || data.output || getLocalResponse(body.mensaje);
            return jsonResponse({
              respuesta: botResponse,
              source: "n8n"
            });
          }
        } catch (e) {
          console.log("⚠️ n8n no disponible, usando respuesta local");
        }

        // FALLBACK: respuesta local
        return jsonResponse({
          respuesta: getLocalResponse(body.mensaje),
          source: "local"
        });

      } catch (error) {
        console.error("❌ Error:", error);
        return jsonResponse({
          respuesta: "⚠️ Ocurrió un error. Por favor, intenta nuevamente.",
          source: "error"
        });
      }
    }

    // ============================================================
    // API PRODUCTOS (D1)
    // ============================================================
    if (path === "/api/products" && request.method === "GET") {
      try {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") || "";
        const categoria = url.searchParams.get("category") || "";

        let query = `SELECT * FROM productos WHERE 1=1`;
        const params = [];

        if (search) {
          query += ` AND nombre LIKE ?`;
          params.push(`%${search}%`);
        }
        if (categoria) {
          query += ` AND categoria = ?`;
          params.push(categoria);
        }
        query += ` ORDER BY id DESC`;

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return jsonResponse({ products: results });
      } catch (e) {
        return jsonResponse({ error: e.message }, 500);
      }
    }

    // ============================================================
    // WHATSAPP
    // ============================================================
    if (path === "/webhook") {
      if (request.method === "GET") {
        return verifyWhatsApp(request, env);
      }
      if (request.method === "POST") {
        return new Response("OK", { status: 200 });
      }
    }

    // ============================================================
    // ARCHIVOS ESTÁTICOS
    // ============================================================
    return env.ASSETS.fetch(request);
  }
};

// ============================================================
// UTILIDADES
// ============================================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

async function verifyWhatsApp(request, env) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}