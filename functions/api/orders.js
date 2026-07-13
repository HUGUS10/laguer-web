export async function onRequestGet(context) {
  const { env } = context;
  try {
    const stmt = env.DB.prepare("SELECT * FROM pedidos ORDER BY fecha DESC");
    const { results } = await stmt.all();
    return new Response(JSON.stringify({ orders: results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}