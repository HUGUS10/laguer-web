export async function onRequestGet(context) {
  const { env } = context;
  try {
    const stmt = env.DB.prepare("SELECT id, nombre, categoria, precio, stock FROM productos ORDER BY nombre ASC");
    const { results } = await stmt.all();
    return new Response(JSON.stringify({ inventory: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}