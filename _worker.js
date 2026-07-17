// ============================================================
// _worker.js - LAGUER STORE
// Cloudflare Pages Worker + D1 + n8n IA
// ============================================================


const N8N_WEBHOOK = "https://TU-N8N-DOMINIO/webhook/laguer-ia";


export default {

async fetch(request, env){


const url = new URL(request.url);
const path = url.pathname;



// ============================================================
// WEBHOOK WHATSAPP
// ============================================================

if(path === "/webhook"){

    if(request.method==="GET"){
        return verifyWhatsApp(request,env);
    }


    if(request.method==="POST"){
        return whatsappMessage(request,env);
    }

}



// ============================================================
// API
// ============================================================

if(path.startsWith("/api/")){

    return handleApi(request,env);

}



// ============================================================
// ARCHIVOS DE LA WEB
// ============================================================

return serveStatic(request,env);


}

};



// ============================================================
// CHAT IA LAGUER
// WEB -> CLOUDFLARE -> N8N -> GEMINI
// ============================================================


async function chatIA(request,env){

try{


const body = await request.json();



const respuesta = await fetch(
N8N_WEBHOOK,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},


body:JSON.stringify({

mensaje:body.mensaje,

usuario:body.usuario || null,

productos:await getProducts(env.DB),

historial:body.historial || [],

empresa:"LAGUER"

})


});



const data = await respuesta.json();



return jsonResponse({

respuesta:
data.respuesta ||
data.output ||
"Sin respuesta de IA"


});



}catch(error){


console.error(error);


return jsonResponse({

error:"Error conectando con LAGUER IA"

},500);


}


}



// ============================================================
// PRODUCTOS PARA IA
// ============================================================


async function getProducts(db){


try{


const {results}=await db
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
ORDER BY id DESC
LIMIT 50
`
)
.all();



return results || [];


}catch(e){


return [];


}


}



// ============================================================
// WHATSAPP VERIFY
// ============================================================


async function verifyWhatsApp(request,env){


const url=new URL(request.url);


const mode=url.searchParams.get("hub.mode");

const token=url.searchParams.get("hub.verify_token");

const challenge=url.searchParams.get("hub.challenge");



if(
mode==="subscribe" &&
token===env.WHATSAPP_VERIFY_TOKEN
){

return new Response(
challenge,
{
status:200
}
);


}


return new Response(
"Forbidden",
{
status:403
}
);


}



// ============================================================
// WHATSAPP ENTRANTE
// ============================================================


async function whatsappMessage(request,env){


try{


const body=await request.json();


console.log(
"WhatsApp:",
body
);



return new Response(
"OK",
{
status:200
}
);


}catch(e){


return new Response(
"OK",
{
status:200
}
);


}


}



// ============================================================
// API ROUTER
// ============================================================


async function handleApi(request,env){


const url=new URL(request.url);


const path=url.pathname.replace(
"/api/",
""
);



if(request.method==="OPTIONS"){

return new Response(
null,
{
headers:{
"Access-Control-Allow-Origin":"*"
}
}
);

}



// ===============================
// CHAT
// ===============================

if(
path==="chat" &&
request.method==="POST"
){

return chatIA(request,env);

}



// ===============================
// AQUI VAN PRODUCTOS,
// LOGIN,
// USERS,
// PEDIDOS...
// PARTE 2
// ===============================



return jsonResponse(
{
error:"Endpoint no encontrado"
},
404
);


}



// ============================================================
// JSON RESPONSE
// ============================================================


function jsonResponse(data,status=200){


return new Response(
JSON.stringify(data),
{

status,

headers:{

"Content-Type":"application/json",

"Access-Control-Allow-Origin":"*",

"Access-Control-Allow-Headers":"Content-Type"

}

}
);


}



// ============================================================
// SERVIR PAGINA
// ============================================================


async function serveStatic(request,env){


return env.ASSETS.fetch(request);


}

// ============================================================
// PRODUCTOS
// ============================================================


if(
path==="products" &&
request.method==="GET"
){

try{


const search =
url.searchParams.get("search") || "";


const categoria =
url.searchParams.get("category") || "";



let query =
`
SELECT *
FROM productos
WHERE 1=1
`;



const params=[];



if(search){

query += `
AND nombre LIKE ?
`;

params.push(
`%${search}%`
);

}



if(categoria){

query += `
AND categoria=?
`;

params.push(categoria);

}



query += `
ORDER BY id DESC
`;



const {results}=await env.DB
.prepare(query)
.bind(...params)
.all();



return jsonResponse({

products:results

});


}catch(e){


return jsonResponse({

error:e.message

},500);


}


}



// CREAR PRODUCTO ADMIN

if(
path==="products" &&
request.method==="POST"
){

try{


const data =
await request.json();



const result =
await env.DB.prepare(

`
INSERT INTO productos
(
nombre,
categoria,
precio,
stock,
imagen,
descripcion,
en_oferta,
descuento,
sku
)

VALUES
(?,?,?,?,?,?,?,?,?)
`

)
.bind(

data.nombre,

data.categoria || "",

data.precio,

data.stock || 0,

data.imagen || "",

data.descripcion || "",

data.en_oferta || 0,

data.descuento || 0,

data.sku || ""

)

.run();



return jsonResponse({

success:true,

id:
result.meta.last_row_id

});



}catch(e){


return jsonResponse({

error:e.message

},500);


}


}




// ============================================================
// REGISTRO USUARIO
// ============================================================


if(
path==="register" &&
request.method==="POST"
){

try{


const data =
await request.json();



if(
!data.nombre ||
!data.email ||
!data.password
){

return jsonResponse({

error:
"Datos incompletos"

},400);

}




const existe =
await env.DB.prepare(

`
SELECT id
FROM users
WHERE email=?
`

)
.bind(data.email)
.first();



if(existe){

return jsonResponse({

error:
"Email ya registrado"

},409);


}




const result =
await env.DB.prepare(

`
INSERT INTO users
(
nombre,
email,
password,
telefono,
dni
)

VALUES
(?,?,?,?,?)
`

)
.bind(

data.nombre,

data.email,

data.password,

data.telefono || "",

data.dni || ""

)

.run();



return jsonResponse({

success:true,

id:
result.meta.last_row_id,

message:
"Usuario registrado correctamente"

});



}catch(e){


return jsonResponse({

error:e.message

},500);


}


}





// ============================================================
// LOGIN
// ============================================================


if(
path==="login" &&
request.method==="POST"
){

try{


const data =
await request.json();



const user =
await env.DB.prepare(

`
SELECT
id,
nombre,
email,
rol,
telefono,
dni

FROM users

WHERE email=?
AND password=?

`

)

.bind(

data.email,

data.password

)

.first();



if(!user){


return jsonResponse({

error:
"Credenciales incorrectas"

},401);


}



return jsonResponse({

success:true,

user:user

});



}catch(e){


return jsonResponse({

error:e.message

},500);


}


}




// ============================================================
// LISTAR USUARIOS ADMIN
// ============================================================


if(
path==="users" &&
request.method==="GET"
){

try{


const {results}=await env.DB
.prepare(

`
SELECT

id,
nombre,
email,
rol,
telefono,
dni,
fecha_registro

FROM users

ORDER BY id DESC

`

)
.all();



return jsonResponse({

users:results

});



}catch(e){


return jsonResponse({

error:e.message

},500);


}


}

// ============================================================
// PEDIDOS
// ============================================================


// LISTAR PEDIDOS

if(
path==="orders" &&
request.method==="GET"
){

try{


const estado =
url.searchParams.get("estado") || "";



let query =
`
SELECT *
FROM pedidos
`;



let params=[];



if(estado){

query += `
WHERE estado=?
`;

params.push(estado);

}



query += `
ORDER BY fecha DESC
`;



const {results}=await env.DB
.prepare(query)
.bind(...params)
.all();



return jsonResponse({

orders:results

});


}catch(e){

return jsonResponse({

error:e.message

},500);

}


}





// CREAR PEDIDO MANUAL O IA

if(
path==="orders" &&
request.method==="POST"
){

try{


const data =
await request.json();



if(
!data.cliente_nombre ||
!data.items
){

return jsonResponse({

error:"Datos incompletos"

},400);

}




const total =
data.items.reduce(

(sum,item)=>
sum +
(item.precio * item.cantidad),

0

);




// Guardar pedido

const result =
await env.DB.prepare(

`
INSERT INTO pedidos
(
cliente_id,
cliente_nombre,
cliente_email,
total,
estado,
items,
direccion,
telefono
)

VALUES
(?,?,?,?,?,?,?,?)

`

)
.bind(

data.cliente_id || null,

data.cliente_nombre,

data.cliente_email || "",

total,

"pending",

JSON.stringify(data.items),

data.direccion || "",

data.telefono || ""

)

.run();





// RESTAR STOCK

for(
const item of data.items
){

await env.DB.prepare(

`
UPDATE productos
SET stock = stock - ?
WHERE id=?

`

)
.bind(

item.cantidad,

item.id

)

.run();


}





return jsonResponse({

success:true,

id:
result.meta.last_row_id,

total

});



}catch(e){


return jsonResponse({

error:e.message

},500);


}

}





// CAMBIAR ESTADO PEDIDO

if(
path.startsWith("orders/") &&
request.method==="PUT"
){

try{


const id =
path.split("/")[1];


const data =
await request.json();



await env.DB.prepare(

`
UPDATE pedidos
SET estado=?
WHERE id=?

`

)
.bind(

data.estado,

id

)

.run();



return jsonResponse({

success:true

});


}catch(e){


return jsonResponse({

error:e.message

},500);


}

}





// ELIMINAR PEDIDO

if(
path.startsWith("orders/") &&
request.method==="DELETE"
){


const id =
path.split("/")[1];


await env.DB.prepare(

`
DELETE FROM pedidos
WHERE id=?

`

)
.bind(id)
.run();



return jsonResponse({

success:true

});


}






// ============================================================
// CARRITO
// ============================================================


// VER CARRITO USUARIO


if(
path.startsWith("cart/") &&
request.method==="GET"
){

const userId =
path.split("/")[1];



const {results}=await env.DB.prepare(

`
SELECT

c.id,
c.cantidad,

p.*

FROM carrito c

JOIN productos p

ON p.id=c.producto_id

WHERE c.user_id=?

`

)

.bind(userId)
.all();



return jsonResponse({

cart:results

});


}





// AGREGAR AL CARRITO


if(
path==="cart" &&
request.method==="POST"
){


const data =
await request.json();



const existe =
await env.DB.prepare(

`
SELECT id
FROM carrito
WHERE user_id=?
AND producto_id=?

`

)

.bind(

data.user_id,

data.producto_id

)

.first();




if(existe){


await env.DB.prepare(

`
UPDATE carrito
SET cantidad=cantidad+?
WHERE id=?

`

)
.bind(

data.cantidad || 1,

existe.id

)

.run();



}else{


await env.DB.prepare(

`
INSERT INTO carrito
(
user_id,
producto_id,
cantidad
)

VALUES
(?,?,?)

`

)
.bind(

data.user_id,

data.producto_id,

data.cantidad || 1

)

.run();


}



return jsonResponse({

success:true

});


}






// BORRAR CARRITO


if(
path.startsWith("cart/") &&
request.method==="DELETE"
){


const id =
path.split("/")[1];


await env.DB.prepare(

`
DELETE FROM carrito
WHERE id=?

`

)
.bind(id)
.run();



return jsonResponse({

success:true

});


}





// ============================================================
// FAVORITOS
// ============================================================


// LISTAR FAVORITOS


if(
path.startsWith("favorites/") &&
request.method==="GET"
){


const userId =
path.split("/")[1];


const {results}=await env.DB.prepare(

`
SELECT

f.id,
p.*

FROM favoritos f

JOIN productos p

ON p.id=f.producto_id

WHERE f.user_id=?

`

)

.bind(userId)
.all();



return jsonResponse({

favorites:results

});


}




// AGREGAR FAVORITO


if(
path==="favorites" &&
request.method==="POST"
){


const data =
await request.json();



await env.DB.prepare(

`
INSERT OR IGNORE INTO favoritos
(
user_id,
producto_id
)

VALUES
(?,?)

`

)

.bind(

data.user_id,

data.producto_id

)

.run();



return jsonResponse({

success:true

});


}







// ============================================================
// INVENTARIO
// ============================================================



// MOVIMIENTOS INVENTARIO


if(
path==="inventory/movement" &&
request.method==="POST"
){


const data =
await request.json();



const producto =
await env.DB.prepare(

`
SELECT *
FROM productos
WHERE id=?

`

)
.bind(
data.producto_id
)
.first();




if(!producto){

return jsonResponse({

error:"Producto no existe"

},404);

}




let nuevoStock;



if(data.tipo==="entrada"){

nuevoStock =
producto.stock + data.cantidad;

}

else{


nuevoStock =
producto.stock - data.cantidad;


}



if(nuevoStock < 0){

return jsonResponse({

error:"Stock insuficiente"

},400);

}




await env.DB.prepare(

`
UPDATE productos
SET stock=?

WHERE id=?

`

)

.bind(

nuevoStock,

data.producto_id

)

.run();





await env.DB.prepare(

`
INSERT INTO inventario_movimientos
(
producto_id,
tipo,
cantidad,
motivo,
stock_resultante
)

VALUES
(?,?,?,?,?)

`

)

.bind(

data.producto_id,

data.tipo,

data.cantidad,

data.motivo || "",

nuevoStock

)

.run();




return jsonResponse({

success:true,

stock:nuevoStock

});


}

// ============================================================
// DASHBOARD ADMIN
// ============================================================


if(
path==="dashboard" &&
request.method==="GET"
){

try{


const [

orders,

products,

users,

sales,

pending,

stock

]=await Promise.all([


env.DB.prepare(
"SELECT COUNT(*) total FROM pedidos"
).first(),



env.DB.prepare(
"SELECT COUNT(*) total FROM productos"
).first(),



env.DB.prepare(
"SELECT COUNT(*) total FROM users"
).first(),



env.DB.prepare(
"SELECT SUM(total) total FROM pedidos"
).first(),



env.DB.prepare(
"SELECT COUNT(*) total FROM pedidos WHERE estado='pending'"
).first(),



env.DB.prepare(
"SELECT COUNT(*) total FROM productos WHERE stock < 5"
).first()


]);




return jsonResponse({

orders:
orders.total || 0,


products:
products.total || 0,


users:
users.total || 0,


sales:
sales.total || 0,


pending:
pending.total || 0,


lowStock:
stock.total || 0


});



}catch(e){


return jsonResponse({

error:e.message

},500);


}


}






// ============================================================
// ACTIVIDAD DEL SISTEMA
// ============================================================


if(
path==="activity" &&
request.method==="GET"
){

try{


const {results}=await env.DB.prepare(

`
SELECT *

FROM registro_actividad

ORDER BY fecha DESC

LIMIT 50

`

)
.all();



return jsonResponse({

activities:results

});



}catch(e){


return jsonResponse({

error:e.message

},500);


}


}








// ============================================================
// MENSAJES ADMIN
// ============================================================



if(
path==="messages" &&
request.method==="GET"
){

const {results}=await env.DB.prepare(

`
SELECT *

FROM mensajes

ORDER BY fecha DESC

`

)
.all();



return jsonResponse({

messages:results

});


}





if(
path==="messages" &&
request.method==="POST"
){

const data =
await request.json();



await env.DB.prepare(

`
INSERT INTO mensajes

(
titulo,
contenido,
tipo,
autor
)

VALUES
(?,?,?,?)

`

)

.bind(

data.titulo,

data.contenido || "",

data.tipo || "nota",

data.autor || "Administrador"

)

.run();



return jsonResponse({

success:true

});


}







if(
path.startsWith("messages/") &&
request.method==="PUT"
){


const id =
path.split("/")[1];


await env.DB.prepare(

`
UPDATE mensajes

SET leido=1

WHERE id=?

`

)

.bind(id)
.run();



return jsonResponse({

success:true

});


}








// ============================================================
// RECLAMOS
// ============================================================



if(
path==="reclamos" &&
request.method==="POST"
){

const data =
await request.json();



const codigo =
"RCL-" +
Date.now()
.toString()
.slice(-6);




await env.DB.prepare(

`
INSERT INTO reclamos
(
codigo,
tipo_doc,
num_doc,
nombres,
apellidos,
email,
telefono,
pedido,
motivo,
descripcion,
monto
)

VALUES
(?,?,?,?,?,?,?,?,?,?,?)

`

)

.bind(

codigo,

data.tipo_doc || "",

data.num_doc || "",

data.nombres,

data.apellidos,

data.email,

data.telefono,

data.pedido || "",

data.motivo,

data.descripcion,

data.monto || 0

)

.run();





return jsonResponse({

success:true,

codigo

});


}






if(
path==="reclamos" &&
request.method==="GET"
){


const {results}=await env.DB.prepare(

`
SELECT *

FROM reclamos

ORDER BY fecha DESC

`

)
.all();



return jsonResponse({

reclamos:results

});


}







// ============================================================
// MIGRACION DATOS
// ============================================================


if(
path==="migrate" &&
request.method==="POST"
){


const data =
await request.json();





// PRODUCTOS

if(data.products){


for(
const p of data.products
){


await env.DB.prepare(

`
INSERT OR REPLACE INTO productos

(
id,
nombre,
categoria,
precio,
stock,
imagen,
descripcion

)

VALUES
(?,?,?,?,?,?,?)

`

)

.bind(

p.id || null,

p.nombre,

p.categoria || "",

p.precio,

p.stock || 0,

p.imagen || "",

p.descripcion || ""

)

.run();


}

}






// USUARIOS

if(data.users){


for(
const u of data.users
){


await env.DB.prepare(

`
INSERT OR REPLACE INTO users

(
id,
nombre,
email,
password,
rol,
telefono,
dni

)

VALUES
(?,?,?,?,?,?,?)

`

)

.bind(

u.id || null,

u.nombre,

u.email,

u.password,

u.rol || "user",

u.telefono || "",

u.dni || ""

)

.run();


}

}







// PEDIDOS

if(data.orders){


for(
const o of data.orders
){


await env.DB.prepare(

`
INSERT OR REPLACE INTO pedidos

(
id,
cliente_nombre,
cliente_email,
total,
estado,
items,
fecha

)

VALUES
(?,?,?,?,?,?,?)

`

)

.bind(

o.id || null,

o.cliente_nombre,

o.cliente_email || "",

o.total,

o.estado || "pending",

JSON.stringify(
o.items || []
),

o.fecha ||
new Date()
.toISOString()

)

.run();



}

}



return jsonResponse({

success:true,

message:
"Migración completada"

});


}






// ============================================================
// 404
// ============================================================


return jsonResponse(

{
error:"Endpoint no encontrado"
},

404

);