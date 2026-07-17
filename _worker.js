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
    // API - Todas las rutas /api/*
    // ============================================================
    if (path.startsWith("/api/")) {
      return handleApi(request, env);
    }

    // ============================================================
    // ARCHIVOS ESTÁTICOS
    // ============================================================
    return serveStatic(request, env);
  }
};

// ============================================================
// CHAT IA - Conecta con n8n
// ============================================================
async function chatIA(request, env) {
  try {
    const body = await request.json();

    console.log("📨 Mensaje recibido:", body.mensaje);

    const respuesta = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mensaje: body.mensaje,
        usuario: body.usuario || null,
        productos: await getProducts(env.DB),
        historial: body.historial || []
      })
    });

    if (!respuesta.ok) {
      throw new Error(`n8n respondió con error: ${respuesta.status}`);
    }

    const data = await respuesta.json();
    console.log("✅ Respuesta de n8n recibida");

    return jsonResponse({
      respuesta: data.respuesta || data.output || "Lo siento, no pude procesar tu consulta."
    });
  } catch (error) {
    console.error("❌ Error en chatIA:", error);
    return jsonResponse({
      error: "Error conectando con el asistente",
      detalle: error.message
    }, 500);
  }
}

// ============================================================
// OBTENER PRODUCTOS PARA CONTEXTO
// ============================================================
async function getProducts(db) {
  try {
    const { results } = await db
      .prepare(`
        SELECT id, nombre, categoria, precio, stock, descripcion
        FROM productos
        ORDER BY id DESC
        LIMIT 50
      `)
      .all();
    return results || [];
  } catch (e) {
    console.error("Error obteniendo productos:", e);
    return [];
  }
}

// ============================================================
// WHATSAPP VERIFY
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

// ============================================================
// WHATSAPP ENTRANTE
// ============================================================
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
// API ROUTER PRINCIPAL
// ============================================================
async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/", "");

  // CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  // ============================================================
  // CHAT - Endpoint principal
  // ============================================================
  if (path === "chat" && request.method === "POST") {
    return chatIA(request, env);
  }

  // ============================================================
  // PRODUCTOS
  // ============================================================
  if (path === "products" && request.method === "GET") {
    try {
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
  // REGISTRO USUARIO
  // ============================================================
  if (path === "register" && request.method === "POST") {
    try {
      const data = await request.json();
      if (!data.nombre || !data.email || !data.password) {
        return jsonResponse({ error: "Datos incompletos" }, 400);
      }

      const existe = await env.DB
        .prepare(`SELECT id FROM users WHERE email = ?`)
        .bind(data.email)
        .first();

      if (existe) {
        return jsonResponse({ error: "Email ya registrado" }, 409);
      }

      const result = await env.DB
        .prepare(`
          INSERT INTO users (nombre, email, password, telefono, dni)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(data.nombre, data.email, data.password, data.telefono || "", data.dni || "")
        .run();

      return jsonResponse({
        success: true,
        id: result.meta.last_row_id,
        message: "Usuario registrado correctamente"
      });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  // ============================================================
  // LOGIN
  // ============================================================
  if (path === "login" && request.method === "POST") {
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
        return jsonResponse({ error: "Credenciales incorrectas" }, 401);
      }
      return jsonResponse({ success: true, user });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  // ============================================================
  // PEDIDOS
  // ============================================================
  if (path === "orders" && request.method === "GET") {
    try {
      const estado = url.searchParams.get("estado") || "";
      let query = `SELECT * FROM pedidos`;
      const params = [];
      if (estado) {
        query += ` WHERE estado = ?`;
        params.push(estado);
      }
      query += ` ORDER BY fecha DESC`;

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ orders: results });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  if (path === "orders" && request.method === "POST") {
    try {
      const data = await request.json();
      if (!data.cliente_nombre || !data.items) {
        return jsonResponse({ error: "Datos incompletos" }, 400);
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

      // Restar stock
      for (const item of data.items) {
        await env.DB
          .prepare(`UPDATE productos SET stock = stock - ? WHERE id = ?`)
          .bind(item.cantidad, item.id)
          .run();
      }

      return jsonResponse({ success: true, id: result.meta.last_row_id, total });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  // ============================================================
  // CARRITO
  // ============================================================
  if (path.startsWith("cart/") && request.method === "GET") {
    try {
      const userId = path.split("/")[1];
      const { results } = await env.DB
        .prepare(`
          SELECT c.id, c.cantidad, p.*
          FROM carrito c
          JOIN productos p ON p.id = c.producto_id
          WHERE c.user_id = ?
        `)
        .bind(userId)
        .all();
      return jsonResponse({ cart: results });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  if (path === "cart" && request.method === "POST") {
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
      return jsonResponse({ success: true });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  // ============================================================
  // FAVORITOS
  // ============================================================
  if (path.startsWith("favorites/") && request.method === "GET") {
    try {
      const userId = path.split("/")[1];
      const { results } = await env.DB
        .prepare(`
          SELECT f.id, p.*
          FROM favoritos f
          JOIN productos p ON p.id = f.producto_id
          WHERE f.user_id = ?
        `)
        .bind(userId)
        .all();
      return jsonResponse({ favorites: results });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  if (path === "favorites" && request.method === "POST") {
    try {
      const data = await request.json();
      await env.DB
        .prepare(`INSERT OR IGNORE INTO favoritos (user_id, producto_id) VALUES (?, ?)`)
        .bind(data.user_id, data.producto_id)
        .run();
      return jsonResponse({ success: true });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  if (path === "dashboard" && request.method === "GET") {
    try {
      const [orders, products, users, sales, pending, stock] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) total FROM pedidos").first(),
        env.DB.prepare("SELECT COUNT(*) total FROM productos").first(),
        env.DB.prepare("SELECT COUNT(*) total FROM users").first(),
        env.DB.prepare("SELECT SUM(total) total FROM pedidos").first(),
        env.DB.prepare("SELECT COUNT(*) total FROM pedidos WHERE estado='pending'").first(),
        env.DB.prepare("SELECT COUNT(*) total FROM productos WHERE stock < 5").first()
      ]);

      return jsonResponse({
        orders: orders.total || 0,
        products: products.total || 0,
        users: users.total || 0,
        sales: sales.total || 0,
        pending: pending.total || 0,
        lowStock: stock.total || 0
      });
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }

  // ============================================================
  // 404
  // ============================================================
  return jsonResponse({ error: "Endpoint no encontrado" }, 404);
}

// ============================================================
// UTILIDADES
// ============================================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

async function serveStatic(request, env) {
  return env.ASSETS.fetch(request);
}