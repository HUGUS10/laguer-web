export async function onRequestPost(context) {
  try {
    const { nombre, email, password } = await context.request.json();

    if (!nombre || !email || !password) {
      return Response.json({ success: false, error: 'Faltan campos' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    // Verificar si el correo ya existe
    const existing = await context.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return Response.json({ success: false, error: 'Este correo ya está registrado' }, { status: 409 });
    }

    // Insertar nuevo usuario
    await context.env.DB.prepare('INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)')
      .bind(nombre, email, password, 'user')
      .run();

    return Response.json({ success: true, message: 'Usuario registrado correctamente' });
  } catch (error) {
    return Response.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}
