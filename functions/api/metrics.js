export async function onRequestGet(context) {
  const { env } = context;
  try {
    const salesRes = await env.DB.prepare("SELECT SUM(total) as total FROM pedidos WHERE estado = 'completed'").first();
    const ordersRes = await env.DB.prepare("SELECT COUNT(*) as count FROM pedidos").first();
    const clientsRes = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE rol = 'user'").first();
    const activityRes = await env.DB.prepare("SELECT * FROM registro_actividad ORDER BY fecha DESC LIMIT 5").all();

    return new Response(JSON.stringify({
      totalSales: salesRes?.total || 0,
      totalOrders: ordersRes?.count || 0,
      totalClients: clientsRes?.count || 0,
      activity: activityRes.results || []
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}