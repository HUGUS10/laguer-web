// ============================================
// REGISTER.JS PARA PAGES - VERSIÓN CORREGIDA
// ============================================

export async function onRequest(context) {
  const { request, env } = context;
  
  // Solo permitir POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: `Método ${request.method} no permitido. Usa POST.`
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. LEER Y VALIDAR BODY
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: 'JSON inválido en el body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📝 Datos recibidos:', body);

    // 2. VALIDAR CAMPOS
    const { fullName, email, phone } = body;
    
    if (!fullName || fullName.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'El nombre completo es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email válido es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!phone || phone.trim() === '') {
      return new Response(JSON.stringify({
        success: false,
        error: 'El teléfono es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. VERIFICAR EMAIL EXISTENTE
    const existingUser = await env.DB.prepare(
      "SELECT email FROM users WHERE email = ?"
    )
    .bind(email.toLowerCase().trim())
    .first();

    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Este email ya está registrado'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. INSERTAR NUEVO USUARIO
    const result = await env.DB.prepare(
      "INSERT INTO users (nombre, email, telefono) VALUES (?, ?, ?)"
    )
    .bind(
      fullName.trim(),
      email.toLowerCase().trim(),
      phone.trim()
    )
    .run();

    console.log('✅ Usuario registrado:', result);

    // 5. RESPUESTA EXITOSA
    return new Response(JSON.stringify({
      success: true,
      message: '¡Registro exitoso!',
      data: {
        id: result.meta?.last_row_id || null,
        nombre: fullName.trim(),
        email: email.toLowerCase().trim(),
        telefono: phone.trim()
      }
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}