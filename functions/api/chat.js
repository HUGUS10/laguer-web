export async function onRequestPost(context){

const {request,env}=context;


try{


const body = await request.json();


const mensaje = body.mensaje || "";

const usuario = body.usuario || null;



// =============================
// BUSCAR PRODUCTOS EN D1
// =============================


const productos = await env.laguer_db
.prepare(`
SELECT 
nombre,
categoria,
precio,
stock,
descripcion
FROM productos
WHERE nombre LIKE ?
LIMIT 5
`)
.bind(`%${mensaje}%`)
.all();



let datosUsuario=null;



// =============================
// BUSCAR USUARIO
// =============================


if(usuario?.email){


datosUsuario = await env.laguer_db
.prepare(`
SELECT 
nombre,
email,
telefono,
direccion
FROM users
WHERE email=?
`)
.bind(usuario.email)
.first();


}



// =============================
// ENVIAR A N8N
// =============================


const n8nResponse = await fetch(
"https://hugolaban.app.n8n.cloud/webhook/laguer-ia",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},


body:JSON.stringify({

mensaje,

usuario:datosUsuario,

productos:productos.results,

empresa:"LAGUER"


})

});


const ia = await n8nResponse.json();



// =============================
// RESPUESTA A CHAT.JS
// =============================


return Response.json({

respuesta:
ia.respuesta ||
ia.output ||
ia.message ||
"Estoy procesando tu consulta"

});


}


catch(error){


return Response.json({

error:error.message

},
{
status:500
});


}


}