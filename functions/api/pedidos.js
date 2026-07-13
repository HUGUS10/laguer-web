// GET - Obtener pedidos del usuario
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return Response.json({ success: false, error: 'user_id requerido' }, { status: 400 });
    }

    const result = await context.env.DB.prepare('SELECT * FROM pedidos WHERE cliente_id = ? ORDER BY fecha DESC')
      .bind(userId).all();

    return Response.json({ success: true, pedidos: result.results });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// POST - Crear pedido
export async function onRequestPost(context) {
  try {
    const { cliente_id, cliente_nombre, cliente_email, total, items, direccion, telefono } = await context.request.json();

    if (!cliente_nombre || !total || !items) {
      return Response.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }

    const result = await context.env.DB.prepare(`
      INSERT INTO pedidos (cliente_id, cliente_nombre, cliente_email, total, items, direccion, telefono)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(cliente_id || null, cliente_nombre, cliente_email || null, total, JSON.stringify(items), direccion || null, telefono || null).run();

    return Response.json({ success: true, pedido_id: result.meta.last_row_id });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
