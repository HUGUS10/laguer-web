export async function onRequestGet(context) {
  try {
    const id = context.params.id;
    const producto = await context.env.DB.prepare('SELECT * FROM productos WHERE id = ?').bind(id).first();

    if (!producto) {
      return Response.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    return Response.json({ success: true, producto });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
