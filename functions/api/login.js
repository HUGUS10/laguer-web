export async function onRequestPost(context) {
  try {
    const { email, password } = await context.request.json();
    
    if (!email || !password) {
      return Response.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }

    const stmt = context.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email);
    const user = await stmt.first();

    if (!user) {
      return Response.json({ success: false, error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    if (user.password !== password) {
      return Response.json({ success: false, error: 'Correo o contraseña incorrectos' }, { status: 401 });
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
