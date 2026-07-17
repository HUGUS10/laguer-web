// ===============================================
// LAGUER AI CHAT API
// Cloudflare Functions + D1 + n8n + Gemini
// functions/api/chat.js
// ===============================================


export async function onRequestPost(context) {


const {request, env} = context;


try {



const body = await request.json();



const mensaje = body.mensaje || "";

const usuario = body.usuario || null;

const historial = body.historial || [];



if(!mensaje){

return Response.json({

error:"Mensaje vacío"

},{status:400});

}




// ===============================================
// BUSCAR USUARIO EN D1
// ===============================================


let userData=null;



if(usuario?.email){


userData =
await env.laguer_db
.prepare(
`
SELECT 
nombre,
email,
telefono,
direccion,
rol
FROM users
WHERE email=?
`
)
.bind(usuario.email)
.first();


}




// ===============================================
// BUSCAR PRODUCTOS
// ===============================================


const productos =
await env.laguer_db
.prepare(
`
SELECT
nombre,
categoria,
precio,
stock,
descripcion,
imagen,
descuento
FROM productos
WHERE 
nombre LIKE ?
OR categoria LIKE ?
LIMIT 10
`
)
.bind(
`%${mensaje}%`,
`%${mensaje}%`
)
.all();




// ===============================================
// ENVIAR CONTEXTO A N8N
// ===============================================


const n8nResponse =
await fetch(

"https://hugolaban.app.n8n.cloud/webhook/laguer-ia",

{

method:"POST",

headers:{

"Content-Type":"application/json"

},


body:JSON.stringify({

empresa:"LAGUER",


mensaje,


usuario:userData,


productos:productos.results || [],


historial,


pagina:request.headers.get("referer") || ""

})


}

);




if(!n8nResponse.ok){


throw new Error(
"N8N no respondió correctamente"
);


}




const ia =
await n8nResponse.json();





const respuesta =

ia.respuesta ||

ia.output ||

ia.message ||

"Estoy aquí para ayudarte con LAGUER.";






// ===============================================
// GUARDAR CONVERSACIÓN EN D1
// ===============================================


await env.laguer_db
.prepare(

`
INSERT INTO chat_history
(
email,
mensaje,
respuesta
)
VALUES
(?,?,?)
`

)
.bind(

usuario?.email || "visitante",

mensaje,

respuesta

)
.run();






return Response.json({

respuesta

});





}

catch(error){


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