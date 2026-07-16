// ============================================================
// _worker.js - Worker para LAGUER con D1 (API + Bot de WhatsApp)
// ============================================================

const CLAUDE_MODEL = "claude-sonnet-4-6";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // --- Webhook del bot de WhatsApp ---
    if (path === '/webhook') {
      if (request.method === 'GET') return handleWebhookVerify(request, env);
      if (request.method === 'POST') return handleWebhookMessage(request, env);
    }

    // Solo manejar rutas /api/*
    if (path.startsWith('/api/')) {
      return handleApi(request, env);
    }

    // Para cualquier otra ruta, dejar que Pages sirva el archivo estático
    return serveStatic(request, env);
  }
};

// ============================================================
// BOT DE WHATSAPP
// ============================================================

// Verificación del webhook (Meta hace un GET una sola vez al configurar)
async function handleWebhookVerify(request, env) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// Mensajes entrantes de WhatsApp
async function handleWebhookMessage(request, env) {
  try {
    const body = await request.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      // eventos de "status" (entregado/leído), los ignoramos
      return new Response('OK', { status: 200 });
    }

    const from = message.from; // número del cliente
    const text = message.text?.body ?? '';

    const reply = await handleIncomingMessage(env, from, text);
    await sendWhatsAppMessage(env, from, reply);

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Error procesando mensaje de WhatsApp:', err);
    return new Response('OK', { status: 200 }); // 200 igual, para que Meta no reintente en loop
  }
}

async function handleIncomingMessage(env, phone, userText) {
  const db = env.DB;
  const history = await getConversationHistory(db, phone);
  const relevantProducts = await searchProducts(db, userText);
  const systemPrompt = buildSystemPrompt(relevantProducts);

  const messages = [...history, { role: 'user', content: userText }];

  const claudeResponse = await callClaude(env, systemPrompt, messages);
  const { replyText, toolResults } = await processClaudeResponse(db, phone, claudeResponse);

  const newHistory = [
    ...history,
    { role: 'user', content: userText },
    { role: 'assistant', content: replyText },
  ].slice(-20); // últimos 20 mensajes, para no crecer infinito

  await saveConversationHistory(db, phone, newHistory);

  return replyText + (toolResults ? `\n\n${toolResults}` : '');
}

function buildSystemPrompt(products) {
  const catalogText = products.length
    ? products
        .map(
          (p) =>
            `- ${p.nombre} (${p.categoria}) — S/ ${p.precio}${
              p.descuento ? ` (${p.descuento}% dscto)` : ''
            } — stock: ${p.stock}${p.descripcion ? ' — ' + p.descripcion : ''}`
        )
        .join('\n')
    : 'No se encontraron productos relacionados en este momento.';

  return `Eres el asistente de ventas de LAGUER, una tienda peruana online de tecnología, hogar, deporte y accesorios.

Tu trabajo:
- Responder de forma cálida, breve y directa, como un vendedor por WhatsApp (no un robot formal).
- Ayudar al cliente a encontrar el producto que busca y resolver dudas de precio, stock o envío.
- Si el cliente confirma que quiere comprar algo, usa la herramienta "crear_pedido" con los datos exactos del catálogo.
- Los pagos se hacen por Yape, Plin, tarjeta o PayPal — si preguntan, menciona que eso se coordina al cerrar el pedido.
- Si no tienes el producto que piden, sugiere alternativas del catálogo si aplica, sin inventar productos que no están en la lista.
- Nunca inventes precios ni stock: usa solo el catálogo de abajo.

CATÁLOGO RELEVANTE A ESTA CONSULTA:
${catalogText}

Responde siempre en español, tono peruano informal pero profesional. Mensajes cortos (es WhatsApp, no correo).`;
}

async function callClaude(env, systemPrompt, messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages,
      tools: [
        {
          name: 'crear_pedido',
          description:
            'Crea un pedido cuando el cliente confirma que quiere comprar uno o más productos del catálogo.',
          input_schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', description: 'id del producto en la tabla productos' },
                    nombre: { type: 'string' },
                    cantidad: { type: 'number' },
                    precio: { type: 'number' },
                  },
                  required: ['nombre', 'cantidad', 'precio'],
                },
              },
              direccion: { type: 'string', description: 'dirección de envío si el cliente la dio' },
            },
            required: ['items'],
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${errText}`);
  }

  return response.json();
}

async function processClaudeResponse(db, phone, claudeData) {
  let replyText = '';
  let toolResults = '';

  for (const block of claudeData.content ?? []) {
    if (block.type === 'text') {
      replyText += block.text;
    }
    if (block.type === 'tool_use' && block.name === 'crear_pedido') {
      const items = block.input?.items ?? [];
      const direccion = block.input?.direccion ?? '';
      const total = items.reduce((sum, it) => sum + it.cantidad * it.precio, 0);

      await db
        .prepare(
          `INSERT INTO pedidos (cliente_nombre, cliente_email, total, estado, items, direccion, telefono)
           VALUES (?, ?, ?, 'pending', ?, ?, ?)`
        )
        .bind(`Cliente WhatsApp ${phone}`, '', total, JSON.stringify(items), direccion, phone)
        .run();

      await db
        .prepare('INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)')
        .bind(`Cliente WhatsApp ${phone}`, 'Nueva orden creada (bot)', `Pedido por S/ ${total.toFixed(2)}`)
        .run();

      toolResults = `✅ Pedido registrado por un total de S/ ${total.toFixed(
        2
      )}. En breve te contactamos para coordinar el pago (Yape, Plin, tarjeta o PayPal) y el envío.`;
    }
  }

  if (!replyText) {
    replyText = 'Gracias por escribirnos, en un momento te ayudamos 🙌';
  }

  return { replyText, toolResults };
}

/** --- D1 helpers (tablas reales: productos, conversaciones) --- */

async function searchProducts(db, userText) {
  const keywords = userText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);

  if (keywords.length === 0) return [];

  const likeClauses = keywords.map(
    () => '(LOWER(nombre) LIKE ? OR LOWER(categoria) LIKE ? OR LOWER(descripcion) LIKE ?)'
  );
  const query = `SELECT id, nombre, categoria, precio, stock, descripcion, descuento FROM productos WHERE ${likeClauses.join(
    ' OR '
  )} LIMIT 8`;
  const params = keywords.flatMap((k) => [`%${k}%`, `%${k}%`, `%${k}%`]);

  const result = await db.prepare(query).bind(...params).all();
  return result.results ?? [];
}

async function getConversationHistory(db, phone) {
  const row = await db.prepare('SELECT historial FROM conversaciones WHERE telefono = ?').bind(phone).first();
  if (!row) return [];
  try {
    return JSON.parse(row.historial);
  } catch {
    return [];
  }
}

async function saveConversationHistory(db, phone, history) {
  await db
    .prepare(
      `INSERT INTO conversaciones (telefono, historial, actualizado)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(telefono) DO UPDATE SET historial = excluded.historial, actualizado = excluded.actualizado`
    )
    .bind(phone, JSON.stringify(history))
    .run();
}

/** --- WhatsApp Cloud API --- */

async function sendWhatsAppMessage(env, to, text) {
  await fetch(`https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      text: { body: text },
    }),
  });
}

// ============================================================
// FUNCIÓN PARA SERVIR ARCHIVOS ESTÁTICOS (usando ASSETS)
// ============================================================
async function serveStatic(request, env) {
  try {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }
    return new Response('Página no encontrada', { status: 404 });
  } catch (error) {
    return new Response('Error al servir el archivo', { status: 500 });
  }
}

// ============================================================
// FUNCIÓN PARA MANEJAR LAS RUTAS DE API
// ============================================================
async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = env.DB;

  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: corsHeaders
    });
  }

  function error(message, status = 400) {
    return json({ error: message }, status);
  }

  try {
    // ==========================================================
    // LOGIN
    // ==========================================================
    if (path === 'login' && request.method === 'POST') {
      const { email, password } = await request.json();
      if (!email || !password) return error('Email y contraseña requeridos');

      const user = await db.prepare(
        'SELECT id, nombre, email, rol, telefono, dni FROM users WHERE email = ? AND password = ?'
      ).bind(email, password).first();

      if (!user) return error('Credenciales incorrectas', 401);

      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind(user.nombre, 'login', 'Inicio de sesión').run();

      return json({ success: true, user });
    }

    // ==========================================================
    // REGISTRO
    // ==========================================================
    if (path === 'register' && request.method === 'POST') {
      const { nombre, email, password, telefono, dni } = await request.json();
      if (!nombre || !email || !password) return error('Nombre, email y contraseña son obligatorios');
      if (password.length < 6) return error('La contraseña debe tener al menos 6 caracteres');

      const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existing) return error('Este email ya está registrado', 409);

      const result = await db.prepare(
        'INSERT INTO users (nombre, email, password, telefono, dni) VALUES (?, ?, ?, ?, ?)'
      ).bind(nombre, email, password, telefono || '', dni || '').run();

      return json({
        success: true,
        id: result.meta.last_row_id,
        message: 'Usuario registrado correctamente'
      });
    }

    // ==========================================================
    // PRODUCTOS
    // ==========================================================
    if (path === 'products' && request.method === 'GET') {
      const search = url.searchParams.get('search') || '';
      const cat = url.searchParams.get('category') || '';
      let query = 'SELECT * FROM productos WHERE 1=1';
      const params = [];
      if (search) { query += ' AND nombre LIKE ?'; params.push(`%${search}%`); }
      if (cat) { query += ' AND categoria = ?'; params.push(cat); }
      query += ' ORDER BY id DESC';

      const { results } = await db.prepare(query).bind(...params).all();
      return json({ products: results });
    }

    if (path === 'products' && request.method === 'POST') {
      const { nombre, categoria, precio, stock, imagen, descripcion, en_oferta, descuento, sku } = await request.json();
      if (!nombre || precio === undefined) return error('Nombre y precio son obligatorios');

      const result = await db.prepare(
        `INSERT INTO productos (nombre, categoria, precio, stock, imagen, descripcion, en_oferta, descuento, sku)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(nombre, categoria, precio, stock || 0, imagen || '', descripcion || '', en_oferta || 0, descuento || 0, sku || '').run();

      return json({ success: true, id: result.meta.last_row_id });
    }

    if (path.startsWith('products/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM productos WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ==========================================================
    // PEDIDOS
    // ==========================================================
    if (path === 'orders' && request.method === 'GET') {
      const estado = url.searchParams.get('estado') || '';
      let query = 'SELECT * FROM pedidos WHERE 1=1';
      const params = [];
      if (estado) { query += ' AND estado = ?'; params.push(estado); }
      query += ' ORDER BY fecha DESC';

      const { results } = await db.prepare(query).bind(...params).all();
      return json({ orders: results });
    }

    if (path === 'orders' && request.method === 'POST') {
      const { cliente_nombre, cliente_email, total, items, direccion, telefono, cliente_id } = await request.json();
      if (!cliente_nombre || !total || !items) return error('Datos incompletos');

      const result = await db.prepare(
        `INSERT INTO pedidos (cliente_id, cliente_nombre, cliente_email, total, items, direccion, telefono)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(cliente_id || null, cliente_nombre, cliente_email || '', total, JSON.stringify(items), direccion || '', telefono || '').run();

      return json({ success: true, id: result.meta.last_row_id });
    }

    if (path.startsWith('orders/') && request.method === 'PUT') {
      const id = path.split('/')[1];
      const { estado } = await request.json();
      await db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').bind(estado, id).run();
      return json({ success: true });
    }

    if (path.startsWith('orders/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM pedidos WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ==========================================================
    // CARRITO
    // ==========================================================
    if (path.startsWith('cart/') && request.method === 'GET') {
      const userId = path.split('/')[1];
      const { results } = await db.prepare(
        `SELECT c.id, c.cantidad, p.* FROM carrito c
         JOIN productos p ON c.producto_id = p.id
         WHERE c.user_id = ?`
      ).bind(userId).all();
      return json({ cart: results });
    }

    if (path === 'cart' && request.method === 'POST') {
      const { user_id, producto_id, cantidad } = await request.json();
      if (!user_id || !producto_id) return error('Datos incompletos');

      const existing = await db.prepare(
        'SELECT id FROM carrito WHERE user_id = ? AND producto_id = ?'
      ).bind(user_id, producto_id).first();

      if (existing) {
        await db.prepare(
          'UPDATE carrito SET cantidad = cantidad + ? WHERE user_id = ? AND producto_id = ?'
        ).bind(cantidad || 1, user_id, producto_id).run();
      } else {
        await db.prepare(
          'INSERT INTO carrito (user_id, producto_id, cantidad) VALUES (?, ?, ?)'
        ).bind(user_id, producto_id, cantidad || 1).run();
      }

      return json({ success: true });
    }

    if (path.startsWith('cart/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM carrito WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    if (path.startsWith('cart/clear/') && request.method === 'DELETE') {
      const userId = path.split('/')[2];
      await db.prepare('DELETE FROM carrito WHERE user_id = ?').bind(userId).run();
      return json({ success: true });
    }

    // ==========================================================
    // FAVORITOS
    // ==========================================================
    if (path.startsWith('favorites/') && request.method === 'GET') {
      const userId = path.split('/')[1];
      const { results } = await db.prepare(
        `SELECT f.id, p.* FROM favoritos f
         JOIN productos p ON f.producto_id = p.id
         WHERE f.user_id = ?`
      ).bind(userId).all();
      return json({ favorites: results });
    }

    if (path === 'favorites' && request.method === 'POST') {
      const { user_id, producto_id } = await request.json();
      if (!user_id || !producto_id) return error('Datos incompletos');

      await db.prepare(
        'INSERT OR IGNORE INTO favoritos (user_id, producto_id) VALUES (?, ?)'
      ).bind(user_id, producto_id).run();

      return json({ success: true });
    }

    if (path.startsWith('favorites/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM favoritos WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ==========================================================
    // USUARIOS (admin)
    // ==========================================================
    if (path === 'users' && request.method === 'GET') {
      const { results } = await db.prepare(
        'SELECT id, nombre, email, rol, telefono, dni, fecha_registro FROM users ORDER BY id DESC'
      ).all();
      return json({ users: results });
    }

    if (path === 'users' && request.method === 'POST') {
      const { nombre, email, password, rol, telefono, dni } = await request.json();
      if (!nombre || !email || !password) return error('Datos incompletos');

      const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existing) return error('Email ya registrado', 409);

      const result = await db.prepare(
        'INSERT INTO users (nombre, email, password, rol, telefono, dni) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(nombre, email, password, rol || 'user', telefono || '', dni || '').run();

      return json({ success: true, id: result.meta.last_row_id });
    }

    if (path.startsWith('users/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      const user = await db.prepare('SELECT email FROM users WHERE id = ?').bind(id).first();
      if (user?.email === 'admin@laguer.pe') return error('No puedes eliminar al administrador principal', 403);

      await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ==========================================================
    // RECLAMOS
    // ==========================================================
    if (path === 'reclamos' && request.method === 'POST') {
      const data = await request.json();
      const codigo = 'RCL-' + Date.now().toString().slice(-6);

      await db.prepare(
        `INSERT INTO reclamos (codigo, tipo_doc, num_doc, nombres, apellidos, email, telefono, pedido, motivo, descripcion, monto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(codigo, data.tipo_doc, data.num_doc, data.nombres, data.apellidos, data.email, data.telefono, data.pedido || '', data.motivo, data.descripcion, data.monto || 0).run();

      return json({ success: true, codigo });
    }

    // ==========================================================
    // DASHBOARD
    // ==========================================================
    if (path === 'dashboard' && request.method === 'GET') {
      const [
        totalOrders,
        totalProducts,
        totalUsers,
        revenue,
        pendingOrders,
        lowStock
      ] = await Promise.all([
        db.prepare('SELECT COUNT(*) as total FROM pedidos').first(),
        db.prepare('SELECT COUNT(*) as total FROM productos').first(),
        db.prepare('SELECT COUNT(*) as total FROM users').first(),
        db.prepare('SELECT SUM(total) as total FROM pedidos').first(),
        db.prepare('SELECT COUNT(*) as total FROM pedidos WHERE estado = "pending"').first(),
        db.prepare('SELECT COUNT(*) as total FROM productos WHERE stock < 5').first()
      ]);

      return json({
        orders: totalOrders?.total || 0,
        products: totalProducts?.total || 0,
        users: totalUsers?.total || 0,
        revenue: revenue?.total || 0,
        pending: pendingOrders?.total || 0,
        lowStock: lowStock?.total || 0
      });
    }

    // ==========================================================
    // INVENTARIO
    // ==========================================================
    if (path === 'inventory/movements' && request.method === 'GET') {
      const { results } = await db.prepare(
        `SELECT m.*, p.nombre as producto_nombre
         FROM inventario_movimientos m
         JOIN productos p ON m.producto_id = p.id
         ORDER BY m.fecha DESC
         LIMIT 50`
      ).all();
      return json({ movements: results });
    }

    if (path === 'inventory/movement' && request.method === 'POST') {
      const { producto_id, tipo, cantidad, motivo } = await request.json();
      if (!producto_id || !tipo || !cantidad) return error('Datos incompletos');

      const product = await db.prepare('SELECT stock, nombre FROM productos WHERE id = ?').bind(producto_id).first();
      if (!product) return error('Producto no encontrado', 404);

      const nuevoStock = tipo === 'entrada' ? product.stock + cantidad : product.stock - cantidad;
      if (tipo === 'salida' && nuevoStock < 0) return error('No hay suficiente stock', 400);

      await db.prepare('UPDATE productos SET stock = ? WHERE id = ?').bind(nuevoStock, producto_id).run();
      await db.prepare(
        `INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, motivo, stock_resultante)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(producto_id, tipo, cantidad, motivo || '', nuevoStock).run();

      return json({ success: true });
    }

    // ==========================================================
    // MENSAJES
    // ==========================================================
    if (path === 'messages' && request.method === 'GET') {
      const { results } = await db.prepare(
        'SELECT * FROM mensajes ORDER BY fecha DESC'
      ).all();
      return json({ messages: results });
    }

    if (path === 'messages' && request.method === 'POST') {
      const { titulo, contenido, tipo, autor } = await request.json();
      if (!titulo) return error('Título requerido');

      await db.prepare(
        'INSERT INTO mensajes (titulo, contenido, tipo, autor) VALUES (?, ?, ?, ?)'
      ).bind(titulo, contenido || '', tipo || 'nota', autor || 'Administrador').run();

      return json({ success: true });
    }

    if (path.startsWith('messages/') && request.method === 'PUT') {
      const id = path.split('/')[1];
      await db.prepare('UPDATE mensajes SET leido = 1 WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    if (path.startsWith('messages/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM mensajes WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ==========================================================
    // ACTIVIDAD
    // ==========================================================
    if (path === 'activity' && request.method === 'GET') {
      const { results } = await db.prepare(
        'SELECT * FROM registro_actividad ORDER BY fecha DESC LIMIT 20'
      ).all();
      return json({ activities: results });
    }

    // ==========================================================
    // MIGRACIÓN
    // ==========================================================
    if (path === 'migrate' && request.method === 'POST') {
      const { products, orders, users, cart, favs } = await request.json();

      if (products?.length) {
        for (const p of products) {
          await db.prepare(
            `INSERT OR REPLACE INTO productos (id, nombre, categoria, precio, stock, imagen, descripcion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(p.id || null, p.nombre, p.categoria, p.precio, p.stock, p.imagen, p.descripcion || '').run();
        }
      }

      if (users?.length) {
        for (const u of users) {
          await db.prepare(
            `INSERT OR REPLACE INTO users (id, nombre, email, password, rol, telefono, dni)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(u.id || null, u.nombre, u.email, u.password, u.rol || 'user', u.telefono || '', u.dni || '').run();
        }
      }

      if (orders?.length) {
        for (const o of orders) {
          await db.prepare(
            `INSERT OR REPLACE INTO pedidos (id, cliente_nombre, cliente_email, total, estado, items, fecha)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(o.id || null, o.cliente, o.email || '', o.total, o.estado, JSON.stringify(o.items || []), o.fecha || new Date().toISOString()).run();
        }
      }

      return json({ success: true, message: 'Migración completada' });
    }

    // ==========================================================
    // 404 - Ruta no encontrada
    // ==========================================================
    return error('Endpoint no encontrado', 404);

  } catch (err) {
    console.error('API Error:', err);
    return error('Error interno del servidor: ' + err.message, 500);
  }
}