// ============================================================
// _worker.js - LAGUER STORE
// Cloudflare Pages Worker + D1 + n8n IA
// ============================================================

const N8N_WEBHOOK = "https://hugolaban.app.n8n.cloud/webhook/laguer-ia";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // CORS - Manejo de preflight
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
    // CHAT - Proxy para n8n (evita CORS)
    // ============================================================
    if (path === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        
        console.log("📨 Mensaje recibido en Worker:", body.mensaje);

        // Verificar que el mensaje no esté vacío
        if (!body.mensaje || body.mensaje.trim() === "") {
          return new Response(JSON.stringify({
            respuesta: "Por favor, escribe un mensaje válido."
          }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        // Intentar conectar con n8n con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos

        try {
          const respuesta = await fetch(N8N_WEBHOOK, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
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

          if (!respuesta.ok) {
            console.error(`❌ n8n respondió con error: ${respuesta.status}`);
            return new Response(JSON.stringify({
              respuesta: "Lo siento, el asistente está teniendo problemas. Por favor, intenta nuevamente en unos minutos.",
              error: `n8n error: ${respuesta.status}`
            }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            });
          }

          const data = await respuesta.json();
          console.log("✅ Respuesta de n8n recibida");

          return new Response(JSON.stringify({
            respuesta: data.respuesta || data.output || "Lo siento, no pude procesar tu consulta."
          }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });

        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error("❌ Error de conexión con n8n:", fetchError.message);
          
          return new Response(JSON.stringify({
            respuesta: "⚠️ No puedo conectarme al asistente en este momento. Intenta nuevamente en unos segundos.",
            error: fetchError.message
          }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

      } catch (error) {
        console.error("❌ Error en chatIA:", error);
        return new Response(JSON.stringify({
          respuesta: "⚠️ Ocurrió un error interno. Por favor, intenta nuevamente.",
          error: error.message
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // ============================================================
    // WEBHOOK WHATSAPP
    // ============================================================
    if (path === "/webhook") {
      if (request.method === "GET") {
        return verifyWhatsApp(request, env);
      }
      if (request.method === "POST") {
        return whatsappMessage(request, env);
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
        
        return new Response(JSON.stringify({ products: results }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // ============================================================
    // API REGISTRO USUARIO
    // ============================================================
    if (path === "/api/register" && request.method === "POST") {
      try {
        const data = await request.json();
        if (!data.nombre || !data.email || !data.password) {
          return new Response(JSON.stringify({ error: "Datos incompletos" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const existe = await env.DB
          .prepare(`SELECT id FROM users WHERE email = ?`)
          .bind(data.email)
          .first();

        if (existe) {
          return new Response(JSON.stringify({ error: "Email ya registrado" }), {
            status: 409,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const result = await env.DB
          .prepare(`
            INSERT INTO users (nombre, email, password, telefono, dni)
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(
            data.nombre,
            data.email,
            data.password,
            data.telefono || "",
            data.dni || ""
          )
          .run();

        return new Response(JSON.stringify({
          success: true,
          id: result.meta.last_row_id,
          message: "Usuario registrado correctamente"
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // ============================================================
    // API LOGIN
    // ============================================================
    if (path === "/api/login" && request.method === "POST") {
      try {
        const data = await request.json();
        const user = await env.DB
          .prepare(`
            SELECT id, nombre, email, rol, telefono, dni
            FROM users
            WHERE email = ? AND password = ?
          `)
          .bind(data.email, data.password)
          .first();

        if (!user) {
          return new Response(JSON.stringify({ error: "Credenciales incorrectas" }), {
            status: 401,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        return new Response(JSON.stringify({ success: true, user }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // ============================================================
    // WHATSAPP
    // ============================================================
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

    async function whatsappMessage(request, env) {
      try {
        const body = await request.json();
        console.log("📱 WhatsApp:", body);
        return new Response("OK", { status: 200 });
      } catch (e) {
        return new Response("OK", { status: 200 });
      }
    }

    // ============================================================
    // ARCHIVOS ESTÁTICOS (Página web)
    // ============================================================
    return env.ASSETS.fetch(request);
  }
};