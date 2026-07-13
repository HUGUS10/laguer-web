export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const cat = url.searchParams.get('cat');
    const search = url.searchParams.get('search');
    const oferta = url.searchParams.get('oferta');

    let sql = 'SELECT * FROM productos WHERE 1=1';
    const params = [];

    if (cat) {
      sql += ' AND categoria = ?';
      params.push(cat);
    }
    if (search) {
      sql += ' AND (nombre LIKE ? OR descripcion LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (oferta === '1') {
      sql += ' AND en_oferta = 1';
    }
    sql += ' ORDER BY id DESC';

    const stmt = context.env.DB.prepare(sql).bind(...params);
    const result = await stmt.all();

    return Response.json({ success: true, productos: result.results });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
