export async function onRequestGet(context) {
  const { env } = context;
  try {
    const stmt = env.DB.prepare("SELECT id, nombre, email, rol, fecha_registro FROM users ORDER BY fecha_registro DESC");
    const { results } = await stmt.all();
    return new Response(JSON.stringify({ clients: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}