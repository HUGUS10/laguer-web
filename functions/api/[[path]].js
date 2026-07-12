// ============================================================
// functions/api/[[path]].js
// API completa para LAGUER con D1
// ============================================================

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  // CORS
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

  // Helper para respuestas
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
    // 1. AUTH
    // ==========================================================

    // POST /api/login
    if (path === 'login' && request.method === 'POST') {
      const { email, password } = await request.json();
      if (!email || !password) return error('Email y contraseña requeridos');

      const user = await db.prepare(
        'SELECT id, nombre, email, rol, telefono, dni FROM users WHERE email = ? AND password = ?'
      ).bind(email, password).first();

      if (!user) return error('Credenciales incorrectas', 401);

      // Registrar actividad
      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind(user.nombre, 'login', `Inicio de sesión desde IP`).run();

      return json({ success: true, user });
    }

    // POST /api/register
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

    // GET /api/user/:id
    if (path.startsWith('user/') && request.method === 'GET') {
      const id = path.split('/')[1];
      const user = await db.prepare(
        'SELECT id, nombre, email, rol, telefono, dni, direccion FROM users WHERE id = ?'
      ).bind(id).first();
      if (!user) return error('Usuario no encontrado', 404);
      return json({ user });
    }

    // PUT /api/user/:id (actualizar perfil)
    if (path.startsWith('user/') && request.method === 'PUT') {
      const id = path.split('/')[1];
      const { nombre, telefono, dni, direccion } = await request.json();
      await db.prepare(
        'UPDATE users SET nombre = ?, telefono = ?, dni = ?, direccion = ? WHERE id = ?'
      ).bind(nombre, telefono, dni, direccion, id).run();

      // Registrar actividad
      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind(nombre, 'update_profile', `Usuario ${id} actualizó su perfil`).run();

      return json({ success: true });
    }

    // ==========================================================
    // 2. PRODUCTOS
    // ==========================================================

    // GET /api/products
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

    // GET /api/products/:id
    if (path.startsWith('products/') && request.method === 'GET') {
      const id = path.split('/')[1];
      const product = await db.prepare('SELECT * FROM productos WHERE id = ?').bind(id).first();
      if (!product) return error('Producto no encontrado', 404);
      return json({ product });
    }

    // POST /api/products (admin)
    if (path === 'products' && request.method === 'POST') {
      const { nombre, categoria, precio, stock, imagen, descripcion, en_oferta, descuento, sku } = await request.json();
      if (!nombre || precio === undefined) return error('Nombre y precio son obligatorios');

      const result = await db.prepare(
        `INSERT INTO productos (nombre, categoria, precio, stock, imagen, descripcion, en_oferta, descuento, sku)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(nombre, categoria, precio, stock || 0, imagen || '', descripcion || '', en_oferta || 0, descuento || 0, sku || '').run();

      // Registrar actividad
      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind('admin', 'add_product', `Producto "${nombre}" creado`).run();

      return json({ success: true, id: result.meta.last_row_id });
    }

    // PUT /api/products/:id (admin)
    if (path.startsWith('products/') && request.method === 'PUT') {
      const id = path.split('/')[1];
      const { nombre, categoria, precio, stock, imagen, descripcion, en_oferta, descuento, sku } = await request.json();

      await db.prepare(
        `UPDATE productos SET nombre = ?, categoria = ?, precio = ?, stock = ?, imagen = ?, descripcion = ?, en_oferta = ?, descuento = ?, sku = ?
         WHERE id = ?`
      ).bind(nombre, categoria, precio, stock, imagen, descripcion, en_oferta, descuento, sku, id).run();

      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind('admin', 'edit_product', `Producto ID ${id} actualizado`).run();

      return json({ success: true });
    }

    // DELETE /api/products/:id (admin)
    if (path.startsWith('products/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      const product = await db.prepare('SELECT nombre FROM productos WHERE id = ?').bind(id).first();

      await db.prepare('DELETE FROM productos WHERE id = ?').bind(id).run();

      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind('admin', 'delete_product', `Producto "${product?.nombre || id}" eliminado`).run();

      return json({ success: true });
    }

    // ==========================================================
    // 3. PEDIDOS
    // ==========================================================

    // GET /api/orders
    if (path === 'orders' && request.method === 'GET') {
      const estado = url.searchParams.get('estado') || '';
      let query = 'SELECT * FROM pedidos WHERE 1=1';
      const params = [];
      if (estado) { query += ' AND estado = ?'; params.push(estado); }
      query += ' ORDER BY fecha DESC';

      const { results } = await db.prepare(query).bind(...params).all();
      return json({ orders: results });
    }

    // GET /api/orders/:id
    if (path.startsWith('orders/') && request.method === 'GET') {
      const id = path.split('/')[1];
      const order = await db.prepare('SELECT * FROM pedidos WHERE id = ?').bind(id).first();
      if (!order) return error('Pedido no encontrado', 404);
      return json({ order });
    }

    // POST /api/orders
    if (path === 'orders' && request.method === 'POST') {
      const { cliente_nombre, cliente_email, total, items, direccion, telefono, cliente_id } = await request.json();
      if (!cliente_nombre || !total || !items) return error('Datos incompletos');

      const result = await db.prepare(
        `INSERT INTO pedidos (cliente_id, cliente_nombre, cliente_email, total, items, direccion, telefono)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(cliente_id || null, cliente_nombre, cliente_email || '', total, JSON.stringify(items), direccion || '', telefono || '').run();

      // Registrar actividad
      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind(cliente_nombre, 'new_order', `Pedido creado: #${result.meta.last_row_id}`).run();

      return json({ success: true, id: result.meta.last_row_id });
    }

    // PUT /api/orders/:id (actualizar estado)
    if (path.startsWith('orders/') && request.method === 'PUT') {
      const id = path.split('/')[1];
      const { estado } = await request.json();
      await db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').bind(estado, id).run();

      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind('admin', 'update_order', `Pedido #${id} -> ${estado}`).run();

      return json({ success: true });
    }

    // DELETE /api/orders/:id (admin)
    if (path.startsWith('orders/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM pedidos WHERE id = ?').bind(id).run();

      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind('admin', 'delete_order', `Pedido #${id} eliminado`).run();

      return json({ success: true });
    }

    // ==========================================================
    // 4. CARRITO
    // ==========================================================

    // GET /api/cart/:userId
    if (path.startsWith('cart/') && request.method === 'GET') {
      const userId = path.split('/')[1];
      const { results } = await db.prepare(
        `SELECT c.id, c.cantidad, p.* FROM carrito c
         JOIN productos p ON c.producto_id = p.id
         WHERE c.user_id = ?`
      ).bind(userId).all();
      return json({ cart: results });
    }

    // POST /api/cart
    if (path === 'cart' && request.method === 'POST') {
      const { user_id, producto_id, cantidad } = await request.json();
      if (!user_id || !producto_id) return error('Datos incompletos');

      // Verificar si ya existe
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

    // DELETE /api/cart/:id
    if (path.startsWith('cart/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM carrito WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // DELETE /api/cart/clear/:userId
    if (path.startsWith('cart/clear/') && request.method === 'DELETE') {
      const userId = path.split('/')[2];
      await db.prepare('DELETE FROM carrito WHERE user_id = ?').bind(userId).run();
      return json({ success: true });
    }

    // ==========================================================
    // 5. FAVORITOS
    // ==========================================================

    // GET /api/favorites/:userId
    if (path.startsWith('favorites/') && request.method === 'GET') {
      const userId = path.split('/')[1];
      const { results } = await db.prepare(
        `SELECT f.id, p.* FROM favoritos f
         JOIN productos p ON f.producto_id = p.id
         WHERE f.user_id = ?`
      ).bind(userId).all();
      return json({ favorites: results });
    }

    // POST /api/favorites
    if (path === 'favorites' && request.method === 'POST') {
      const { user_id, producto_id } = await request.json();
      if (!user_id || !producto_id) return error('Datos incompletos');

      await db.prepare(
        'INSERT OR IGNORE INTO favoritos (user_id, producto_id) VALUES (?, ?)'
      ).bind(user_id, producto_id).run();

      return json({ success: true });
    }

    // DELETE /api/favorites/:id
    if (path.startsWith('favorites/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM favoritos WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ==========================================================
    // 6. USUARIOS (para panel admin)
    // ==========================================================

    // GET /api/users
    if (path === 'users' && request.method === 'GET') {
      const { results } = await db.prepare(
        'SELECT id, nombre, email, rol, telefono, dni, fecha_registro FROM users ORDER BY id DESC'
      ).all();
      return json({ users: results });
    }

    // POST /api/users (admin - crear usuario)
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

    // DELETE /api/users/:id (admin)
    if (path.startsWith('users/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      // No permitir eliminar admin principal
      const user = await db.prepare('SELECT email FROM users WHERE id = ?').bind(id).first();
      if (user?.email === 'admin@laguer.pe') return error('No puedes eliminar al administrador principal', 403);

      await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ==========================================================
    // 7. RECLAMOS
    // ==========================================================

    // POST /api/reclamos
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
    // 8. DASHBOARD (estadísticas)
    // ==========================================================

    // GET /api/dashboard
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
    // 9. INVENTARIO (movimientos)
    // ==========================================================

    // GET /api/inventory/movements
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

    // POST /api/inventory/movement
    if (path === 'inventory/movement' && request.method === 'POST') {
      const { producto_id, tipo, cantidad, motivo } = await request.json();
      if (!producto_id || !tipo || !cantidad) return error('Datos incompletos');

      // Obtener stock actual
      const product = await db.prepare('SELECT stock, nombre FROM productos WHERE id = ?').bind(producto_id).first();
      if (!product) return error('Producto no encontrado', 404);

      const nuevoStock = tipo === 'entrada' ? product.stock + cantidad : product.stock - cantidad;
      if (tipo === 'salida' && nuevoStock < 0) return error('No hay suficiente stock', 400);

      await db.prepare('UPDATE productos SET stock = ? WHERE id = ?').bind(nuevoStock, producto_id).run();
      await db.prepare(
        `INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, motivo, stock_resultante)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(producto_id, tipo, cantidad, motivo || '', nuevoStock).run();

      await db.prepare(
        'INSERT INTO registro_actividad (usuario, accion, detalles) VALUES (?, ?, ?)'
      ).bind('admin', 'inventory_movement', `${tipo} de ${cantidad} u. de "${product.nombre}"`).run();

      return json({ success: true });
    }

    // ==========================================================
    // 10. MENSAJES
    // ==========================================================

    // GET /api/messages
    if (path === 'messages' && request.method === 'GET') {
      const { results } = await db.prepare(
        'SELECT * FROM mensajes ORDER BY fecha DESC'
      ).all();
      return json({ messages: results });
    }

    // POST /api/messages
    if (path === 'messages' && request.method === 'POST') {
      const { titulo, contenido, tipo, autor } = await request.json();
      if (!titulo) return error('Título requerido');

      await db.prepare(
        'INSERT INTO mensajes (titulo, contenido, tipo, autor) VALUES (?, ?, ?, ?)'
      ).bind(titulo, contenido || '', tipo || 'nota', autor || 'Administrador').run();

      return json({ success: true });
    }

    // PUT /api/messages/:id (marcar leído)
    if (path.startsWith('messages/') && request.method === 'PUT') {
      const id = path.split('/')[1];
      await db.prepare('UPDATE mensajes SET leido = 1 WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // DELETE /api/messages/:id
    if (path.startsWith('messages/') && request.method === 'DELETE') {
      const id = path.split('/')[1];
      await db.prepare('DELETE FROM mensajes WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    // ==========================================================
    // 11. ACTIVITY LOG
    // ==========================================================

    // GET /api/activity
    if (path === 'activity' && request.method === 'GET') {
      const { results } = await db.prepare(
        'SELECT * FROM registro_actividad ORDER BY fecha DESC LIMIT 20'
      ).all();
      return json({ activities: results });
    }

    // ==========================================================
    // 12. POST /api/migrate (migrar datos de localStorage a D1)
    // ==========================================================

    if (path === 'migrate' && request.method === 'POST') {
      const { products, orders, users, cart, favs } = await request.json();

      // Migrar productos
      if (products?.length) {
        for (const p of products) {
          await db.prepare(
            `INSERT OR REPLACE INTO productos (id, nombre, categoria, precio, stock, imagen, descripcion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(p.id || null, p.nombre, p.categoria, p.precio, p.stock, p.imagen, p.descripcion || '').run();
        }
      }

      // Migrar usuarios
      if (users?.length) {
        for (const u of users) {
          await db.prepare(
            `INSERT OR REPLACE INTO users (id, nombre, email, password, rol, telefono, dni)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(u.id || null, u.nombre, u.email, u.password, u.rol || 'user', u.telefono || '', u.dni || '').run();
        }
      }

      // Migrar pedidos
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

  } catch (error) {
    console.error('API Error:', error);
    return error('Error interno del servidor: ' + error.message, 500);
  }
}