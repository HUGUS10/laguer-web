/* ==========================================
   LAGUER AI CHAT
   chat.js
   Conexión n8n + Firebase + WhatsApp
========================================== */


// WEBHOOK PRODUCCIÓN N8N
const N8N_WEBHOOK = "https://hugolaban.app.n8n.cloud/webhook/laguer-ai";


// ELEMENTOS DEL CHAT
const chatBtn = document.getElementById("laguerChatBtn");
const chat = document.getElementById("laguerChat");
const closeBtn = document.getElementById("closeChat");
const sendBtn = document.getElementById("sendChat");
const input = document.getElementById("chatInput");
const messages = document.getElementById("chatMessages");


// MEMORIA DE CONVERSACIÓN
let conversation = [];


// ABRIR CHAT
if(chatBtn){

    chatBtn.addEventListener("click",()=>{

        chat.classList.add("active");

        input.focus();

    });

}


// CERRAR CHAT
if(closeBtn){

    closeBtn.addEventListener("click",()=>{

        chat.classList.remove("active");

    });

}


// ENTER PARA ENVIAR
if(input){

    input.addEventListener("keypress",(e)=>{

        if(e.key==="Enter"){

            sendMessage();

        }

    });

}


// BOTÓN ENVIAR
if(sendBtn){

    sendBtn.addEventListener("click",sendMessage);

}



// ENVIAR MENSAJE
function sendMessage(){


    const text=input.value.trim();


    if(!text) return;



    addUser(text);


    input.value="";


    typing();


    fetchAI(text);



}




// MENSAJE USUARIO
function addUser(text){


    const div=document.createElement("div");


    div.className="user-message";


    div.textContent=text;


    messages.appendChild(div);


    scrollBottom();


}




// MENSAJE BOT
function addBot(text){


    removeTyping();


    const div=document.createElement("div");


    div.className="bot-message";


    // Permitir saltos de línea y enlaces WhatsApp

    div.innerHTML = text
    .replace(/\n/g,"<br>")
    .replace(
        /(https:\/\/wa\.me\/[0-9]+)/g,
        '<a href="$1" target="_blank" class="whatsapp-link">💬 Abrir WhatsApp</a>'
    );


    messages.appendChild(div);


    scrollBottom();


}





// ANIMACIÓN ESCRIBIENDO
function typing(){


    removeTyping();


    const div=document.createElement("div");


    div.className="typing";


    div.id="typing";


    div.innerHTML=`

        <span></span>
        <span></span>
        <span></span>

    `;


    messages.appendChild(div);


    scrollBottom();


}




// QUITAR ANIMACIÓN
function removeTyping(){


    const t=document.getElementById("typing");


    if(t){

        t.remove();

    }

}




// BAJAR CHAT
function scrollBottom(){


    messages.scrollTop = messages.scrollHeight;


}





// CONEXIÓN CON N8N
async function fetchAI(question){



    try{


        conversation.push({

            role:"user",

            content:question

        });





        const response = await fetch(N8N_WEBHOOK,{


            method:"POST",


            headers:{


                "Content-Type":"application/json"


            },


            body:JSON.stringify({



                message:question,


                history:conversation,


                source:"laguer",


                page:window.location.pathname,


                url:window.location.href,


                userAgent:navigator.userAgent,


                language:navigator.language



            })



        });





        if(!response.ok){


            throw new Error(
                "Error conexión n8n: "+response.status
            );


        }





        const data = await response.json();





        console.log("Respuesta n8n:",data);





        // RESPUESTA DEL N8N

        const answer =

            data.respuesta ||

            data.reply ||

            data.response ||

            data.answer ||

            "No encontré información.";





        conversation.push({


            role:"assistant",


            content:answer



        });





        addBot(answer);





    }catch(error){



        console.error(error);



        removeTyping();



        addBot(

        "⚠️ No pude conectarme con el asistente LAGUER.<br>Inténtalo nuevamente."

        );



    }



}