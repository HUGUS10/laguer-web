export async function onRequestPost(context) {

const {request, env}=context;


try {


const body = await request.json();


const mensaje = body.mensaje || "";

const usuario = body.usuario || null;

const historial = body.historial || [];



// BUSCAR PRODUCTOS EN D1

const productos = await env.laguer_db
.prepare(`
SELECT 
nombre,
precio,
stock,
descripcion
FROM productos
WHERE nombre LIKE ?
LIMIT 5
`)
.bind(`%${mensaje}%`)
.all();





// ENVIAR A N8N


const respuesta = await fetch(
"https://hugolaban.app.n8n.cloud/webhook/laguer-ia",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},


body:JSON.stringify({

mensaje,

usuario,

productos:productos.results,

historial,

empresa:"LAGUER"


})


});



const ia = await respuesta.json();



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