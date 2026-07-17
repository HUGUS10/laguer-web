/* =====================================
   LAGUER GLOBAL SCRIPT
===================================== */


document.addEventListener(
"DOMContentLoaded",
()=>{


console.log(
"Laguer cargado correctamente"
);



actualizarUsuario();



});




// USUARIO

function actualizarUsuario(){


const user =
JSON.parse(
localStorage.getItem("usuario")
);



if(user){

console.log(
"Usuario:",
user.nombre
);

}


}




// LOGOUT

function cerrarSesion(){


localStorage.removeItem(
"usuario"
);


location.reload();


}