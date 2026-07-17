export async function onRequestPost(context){

const {request,env}=context;


try{


const body = await request.json();


const mensaje = body.mensaje || "";

const usuario = body.usuario || null;

const historial = body.historial || [];



// ================================
// BUSCAR PRODUCTOS EN D1
// ================================


const productos = await env.DB
.prepare(
`
SELECT 
id,
nombre,
categoria,
precio,
stock,
descripcion
FROM productos
WHERE nombre LIKE ?
OR categoria LIKE ?
OR descripcion LIKE ?
LIMIT 5
`
)
.bind(
`%${mensaje}%`,
`%${mensaje}%`,
`%${mensaje}%`
)
.all();



// ================================
// BUSCAR USUARIO
// ================================


let userData=null;


if(usuario?.email){


userData = await env.DB
.prepare(
`
SELECT nombre,email,telefono,direccion
FROM users
WHERE email=?
`
)
.bind(usuario.email)
.first();


}




// ================================
// ENVIAR A N8N
// ================================


const respuesta = await fetch(

"https://hugolaban.app.n8n.cloud/webhook/laguer-ia",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},


body:JSON.stringify({

mensaje,

usuario:userData,

historial,

productos:productos.results,

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
}

);


}

}