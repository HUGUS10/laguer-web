// GET - Obtener carrito del usuario
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return Response.json({ success: false, error: 'user_id requerido' }, { status: 400 });
    }

    const result = await context.env.DB.prepare(`
      SELECT c.id, c.cantidad, c.fecha_agregado, p.id as producto_id, p.nombre, p.precio, p.imagen, p.stock
      FROM carrito c
      JOIN productos p ON c.producto_id = p.id
      WHERE c.user_id = ?
    `).bind(userId).all();

    return Response.json({ success: true, items: result.results });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// POST - Agregar producto al carrito
export async function onRequestPost(context) {
  try {
    const { user_id, producto_id, cantidad } = await context.request.json();

    if (!user_id || !producto_id) {
      return Response.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }

    const qty = cantidad || 1;

    await context.env.DB.prepare(`
      INSERT INTO carrito (user_id, producto_id, cantidad)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, producto_id) DO UPDATE SET cantidad = cantidad + ?
    `).bind(user_id, producto_id, qty, qty).run();

    return Response.json({ success: true, message: 'Producto agregado al carrito' });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// DELETE - Remover producto del carrito
export async function onRequestDelete(context) {
  try {
    const { user_id, producto_id } = await context.request.json();

    if (!user_id || !producto_id) {
      return Response.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }

    await context.env.DB.prepare('DELETE FROM carrito WHERE user_id = ? AND producto_id = ?')
      .bind(user_id, producto_id).run();

    return Response.json({ success: true, message: 'Producto removido' });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
