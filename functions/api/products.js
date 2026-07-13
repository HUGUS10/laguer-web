export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    try {
      const stmt = env.DB.prepare("SELECT * FROM productos ORDER BY id DESC");
      const { results } = await stmt.all();
      return new Response(JSON.stringify({ products: results }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { nombre, precio, descuento, categoria, imagen, stock } = body;
      const stmt = env.DB.prepare(
        "INSERT INTO productos (nombre, precio, descuento, categoria, imagen, stock) VALUES (?, ?, ?, ?, ?, ?)"
      );
      await stmt.bind(nombre, precio, descuento || 0, categoria || 'general', imagen || '', stock || 0).run();
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
  return new Response('Method Not Allowed', { status: 405 });
}