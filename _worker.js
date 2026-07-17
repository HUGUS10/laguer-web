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
          })
        });

        if (!respuesta.ok) {
          throw new Error(`n8n respondió con error: ${respuesta.status}`);
        }

        const data = await respuesta.json();
        console.log("✅ Respuesta de n8n recibida");

        return new Response(JSON.stringify({
          respuesta: data.respuesta || data.output || "Lo siento, no pude procesar tu consulta."
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      } catch (error) {
        console.error("❌ Error en chatIA:", error);
        return new Response(JSON.stringify({
          error: "Error conectando con el asistente",
          detalle: error.message
        }), {
          status: 500,
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
    // API PEDIDOS
    // ============================================================
    if (path === "/api/orders" && request.method === "GET") {
      try {
        const url = new URL(request.url);
        const estado = url.searchParams.get("estado") || "";
        let query = `SELECT * FROM pedidos`;
        const params = [];
        if (estado) {
          query += ` WHERE estado = ?`;
          params.push(estado);
        }
        query += ` ORDER BY fecha DESC`;

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify({ orders: results }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    if (path === "/api/orders" && request.method === "POST") {
      try {
        const data = await request.json();
        if (!data.cliente_nombre || !data.items) {
          return new Response(JSON.stringify({ error: "Datos incompletos" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const total = data.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        const result = await env.DB
          .prepare(`
            INSERT INTO pedidos
            (cliente_id, cliente_nombre, cliente_email, total, estado, items, direccion, telefono)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            data.cliente_id || null,
            data.cliente_nombre,
            data.cliente_email || "",
            total,
            "pending",
            JSON.stringify(data.items),
            data.direccion || "",
            data.telefono || ""
          )
          .run();

        for (const item of data.items) {
          await env.DB
            .prepare(`UPDATE productos SET stock = stock - ? WHERE id = ?`)
            .bind(item.cantidad, item.id)
            .run();
        }

        return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id, total }), {
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
    // API CARRITO
    // ============================================================
    if (path.startsWith("/api/cart/") && request.method === "GET") {
      try {
        const userId = path.split("/")[3];
        const { results } = await env.DB
          .prepare(`
            SELECT c.id, c.cantidad, p.*
            FROM carrito c
            JOIN productos p ON p.id = c.producto_id
            WHERE c.user_id = ?
          `)
          .bind(userId)
          .all();
        return new Response(JSON.stringify({ cart: results }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    if (path === "/api/cart" && request.method === "POST") {
      try {
        const data = await request.json();
        const existe = await env.DB
          .prepare(`SELECT id FROM carrito WHERE user_id = ? AND producto_id = ?`)
          .bind(data.user_id, data.producto_id)
          .first();

        if (existe) {
          await env.DB
            .prepare(`UPDATE carrito SET cantidad = cantidad + ? WHERE id = ?`)
            .bind(data.cantidad || 1, existe.id)
            .run();
        } else {
          await env.DB
            .prepare(`INSERT INTO carrito (user_id, producto_id, cantidad) VALUES (?, ?, ?)`)
            .bind(data.user_id, data.producto_id, data.cantidad || 1)
            .run();
        }
        return new Response(JSON.stringify({ success: true }), {
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
    // API FAVORITOS
    // ============================================================
    if (path.startsWith("/api/favorites/") && request.method === "GET") {
      try {
        const userId = path.split("/")[3];
        const { results } = await env.DB
          .prepare(`
            SELECT f.id, p.*
            FROM favoritos f
            JOIN productos p ON p.id = f.producto_id
            WHERE f.user_id = ?
          `)
          .bind(userId)
          .all();
        return new Response(JSON.stringify({ favorites: results }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    if (path === "/api/favorites" && request.method === "POST") {
      try {
        const data = await request.json();
        await env.DB
          .prepare(`INSERT OR IGNORE INTO favoritos (user_id, producto_id) VALUES (?, ?)`)
          .bind(data.user_id, data.producto_id)
          .run();
        return new Response(JSON.stringify({ success: true }), {
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
    // API DASHBOARD
    // ============================================================
    if (path === "/api/dashboard" && request.method === "GET") {
      try {
        const [orders, products, users, sales, pending, stock] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) total FROM pedidos").first(),
          env.DB.prepare("SELECT COUNT(*) total FROM productos").first(),
          env.DB.prepare("SELECT COUNT(*) total FROM users").first(),
          env.DB.prepare("SELECT SUM(total) total FROM pedidos").first(),
          env.DB.prepare("SELECT COUNT(*) total FROM pedidos WHERE estado='pending'").first(),
          env.DB.prepare("SELECT COUNT(*) total FROM productos WHERE stock < 5").first()
        ]);

        return new Response(JSON.stringify({
          orders: orders.total || 0,
          products: products.total || 0,
          users: users.total || 0,
          sales: sales.total || 0,
          pending: pending.total || 0,
          lowStock: stock.total || 0
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