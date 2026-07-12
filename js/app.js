// ===============================
// CARRITO LAGUER
// ===============================


let carrito = JSON.parse(localStorage.getItem("carrito")) || [];


// ACTUALIZAR CONTADOR DEL CARRITO

function actualizarCarrito(){

    const contador = document.getElementById("cartCount");

    if(contador){

        contador.textContent = carrito.length;

    }

}


actualizarCarrito();



// AGREGAR PRODUCTOS

document.querySelectorAll(".add-to-cart").forEach(btn=>{


    btn.addEventListener("click",()=>{


        const producto = {


            id: btn.dataset.id,

            nombre: btn.dataset.name,

            precio: Number(btn.dataset.price),

            cantidad:1


        };


        carrito.push(producto);


        localStorage.setItem(
            "carrito",
            JSON.stringify(carrito)
        );


        actualizarCarrito();



        btn.innerHTML="✓ Agregado";


        setTimeout(()=>{

            btn.innerHTML="Agregar al carrito";

        },1000);



    });


});




// MOSTRAR CARRITO

function mostrarCarrito(){


const lista=document.getElementById("listaCarrito");


const total=document.getElementById("total");


if(!lista) return;



lista.innerHTML="";


let suma=0;



carrito.forEach((producto,index)=>{


suma += producto.precio;



lista.innerHTML += `

<div class="item-carrito">


<h3>
${producto.nombre}
</h3>


<p>
S/ ${producto.precio.toFixed(2)}
</p>


<button onclick="eliminarProducto(${index})">

Eliminar

</button>


</div>

`;


});



if(total){

total.innerHTML=
"S/ "+suma.toFixed(2);

}



}




// ELIMINAR PRODUCTO

function eliminarProducto(index){


carrito.splice(index,1);


localStorage.setItem(
"carrito",
JSON.stringify(carrito)
);



mostrarCarrito();


actualizarCarrito();


}



// VACIAR TODO

function vaciarCarrito(){


carrito=[];


localStorage.removeItem("carrito");


mostrarCarrito();


actualizarCarrito();


}