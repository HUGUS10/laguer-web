// =====================================================
// LAGUER AI CHAT
// Cloudflare Pages Function
// D1 + n8n + Gemini
// =====================================================


export async function onRequestPost(context){


const {request,env}=context;


try{


const body = await request.json();


const mensaje =
(body.mensaje || "").trim();


const historial =
body.historial || [];



const email =

body.usuario?.email ||

body.email ||

null;



if(!mensaje){

return Response.json({

error:"Mensaje vacío"

},{
status:400
});

}



// =====================================================
// BUSCAR PRODUCTOS EN D1
// =====================================================


const productos =

await env.laguer_db

.prepare(

`
SELECT

id,
nombre,
categoria,
precio,
stock,
imagen,
descripcion,
en_oferta,
descuento,
sku

FROM productos

WHERE 
nombre LIKE ?
OR descripcion LIKE ?
OR categoria LIKE ?

LIMIT 10

`

)

.bind(

`%${mensaje}%`,
`%${mensaje}%`,
`%${mensaje}%`

)

.all();





// =====================================================
// BUSCAR USUARIO EN D1
// =====================================================


let usuario=null;



if(email){


usuario =

await env.laguer_db

.prepare(

`
SELECT

id,
nombre,
email,
rol,
telefono,
direccion

FROM users

WHERE email=?

LIMIT 1

`

)

.bind(email)

.first();


}





// =====================================================
// ENVIAR CONTEXTO A N8N
// =====================================================


const n8n =

await fetch(

"https://hugolaban.app.n8n.cloud/webhook/laguer-ia",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},


body:JSON.stringify({


mensaje,


usuario,


productos:
productos.results || [],


historial,


empresa:"LAGUER"


})


}

);





const respuestaN8N =

await n8n.json();






return Response.json({

respuesta:

respuestaN8N.respuesta ||

respuestaN8N.output ||

respuestaN8N.message ||

"Estoy procesando tu consulta"



});






}catch(error){


console.error(
"LAGUER CHAT ERROR:",
error
);



return Response.json({

error:error.message

},
{
status:500
});



}



}