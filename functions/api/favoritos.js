// GET - Obtener favoritos del usuario
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return Response.json({ success: false, error: 'user_id requerido' }, { status: 400 });
    }

    const result = await context.env.DB.prepare(`
      SELECT f.id, f.fecha_agregado, p.id as producto_id, p.nombre, p.precio, p.imagen, p.categoria
      FROM favoritos f
      JOIN productos p ON f.producto_id = p.id
      WHERE f.user_id = ?
    `).bind(userId).all();

    return Response.json({ success: true, favoritos: result.results });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// POST - Agregar a favoritos
export async function onRequestPost(context) {
  try {
    const { user_id, producto_id } = await context.request.json();

    if (!user_id || !producto_id) {
      return Response.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }

    await context.env.DB.prepare('INSERT OR IGNORE INTO favoritos (user_id, producto_id) VALUES (?, ?)')
      .bind(user_id, producto_id).run();

    return Response.json({ success: true, message: 'Agregado a favoritos' });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// DELETE - Remover de favoritos
export async function onRequestDelete(context) {
  try {
    const { user_id, producto_id } = await context.request.json();

    if (!user_id || !producto_id) {
      return Response.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }

    await context.env.DB.prepare('DELETE FROM favoritos WHERE user_id = ? AND producto_id = ?')
      .bind(user_id, producto_id).run();

    return Response.json({ success: true, message: 'Removido de favoritos' });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
