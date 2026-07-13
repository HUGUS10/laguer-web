// GET - Obtener carrito del usuario
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return Response.json({ success: false, error: 'user_id requerido' }, { status: 400 });
    }

    const result = await context.env.DB.prepare(`
      SELECT c.id, c.cantidad, p.id as producto_id, p.nombre, p.precio, p.imagen, p.stock
      FROM carrito c
      JOIN productos p ON c.producto_id = p.id
      WHERE c.user_id = ?
    `).bind(userId).all();

    return Response.json({ success: true, items: result.results });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor: ' + error.message }, { status: 500 });
  }
}

// POST - Agregar o actualizar producto en el carrito
export async function onRequestPost(context) {
  try {
    const { user_id, producto_id, cantidad, action } = await context.request.json();

    if (!user_id || !producto_id) {
      return Response.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }

    const qty = cantidad || 1;

    if (action === 'set') {
      // Establecer cantidad exacta
      if (qty <= 0) {
        await context.env.DB.prepare('DELETE FROM carrito WHERE user_id = ? AND producto_id = ?')
          .bind(user_id, producto_id).run();
      } else {
        await context.env.DB.prepare(`
          INSERT INTO carrito (user_id, producto_id, cantidad)
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, producto_id) DO UPDATE SET cantidad = ?
        `).bind(user_id, producto_id, qty, qty).run();
      }
    } else {
      // Sumar cantidad (acción por defecto)
      await context.env.DB.prepare(`
        INSERT INTO carrito (user_id, producto_id, cantidad)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, producto_id) DO UPDATE SET cantidad = cantidad + ?
      `).bind(user_id, producto_id, qty, qty).run();
    }

    return Response.json({ success: true, message: 'Carrito actualizado' });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor: ' + error.message }, { status: 500 });
  }
}

// DELETE - Remover producto o vaciar carrito
export async function onRequestDelete(context) {
  try {
    const { user_id, producto_id, all } = await context.request.json();

    if (!user_id) {
      return Response.json({ success: false, error: 'user_id requerido' }, { status: 400 });
    }

    if (all) {
      // Vaciar todo el carrito
      await context.env.DB.prepare('DELETE FROM carrito WHERE user_id = ?').bind(user_id).run();
      return Response.json({ success: true, message: 'Carrito vaciado' });
    }

    if (!producto_id) {
      return Response.json({ success: false, error: 'producto_id requerido' }, { status: 400 });
    }

    await context.env.DB.prepare('DELETE FROM carrito WHERE user_id = ? AND producto_id = ?')
      .bind(user_id, producto_id).run();

    return Response.json({ success: true, message: 'Producto removido' });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor: ' + error.message }, { status: 500 });
  }
}
