/* ==========================================
   LAGUER AI CHAT
   chat.js
   Conexión n8n + Firebase
========================================== */


// WEBHOOK PRODUCCIÓN N8N
const N8N_WEBHOOK = "https://hugolaban.app.n8n.cloud/webhook/laguer-ia";


// ELEMENTOS DEL CHAT
const chatBtn = document.getElementById("laguerChatBtn");
const chat = document.getElementById("laguerChat");
const closeBtn = document.getElementById("closeChat");
const sendBtn = document.getElementById("sendChat");
const input = document.getElementById("chatInput");
const messages = document.getElementById("chatMessages");


// MEMORIA CHAT
let conversation = [];


// ===============================
// ABRIR CHAT
// ===============================

if(chatBtn){

    chatBtn.addEventListener("click",()=>{

        chat.classList.add("active");

        if(input){
            input.focus();
        }

    });

}



// ===============================
// CERRAR CHAT
// ===============================

if(closeBtn){

    closeBtn.addEventListener("click",()=>{

        chat.classList.remove("active");

    });

}



// ===============================
// ENTER ENVIAR
// ===============================

if(input){

    input.addEventListener("keypress",(e)=>{

        if(e.key === "Enter"){

            sendMessage();

        }

    });

}



// ===============================
// BOTON ENVIAR
// ===============================

if(sendBtn){

    sendBtn.addEventListener("click",sendMessage);

}



// ===============================
// ENVIAR MENSAJE
// ===============================

function sendMessage(){


    const text = input.value.trim();


    if(!text) return;



    addUser(text);


    input.value = "";


    typing();


    fetchAI(text);


}




// ===============================
// MENSAJE USUARIO
// ===============================

function addUser(text){


    const div=document.createElement("div");


    div.className="user-message";


    div.textContent=text;


    messages.appendChild(div);


    scrollBottom();


}




// ===============================
// MENSAJE BOT
// ===============================

function addBot(text){


    removeTyping();


    const div=document.createElement("div");


    div.className="bot-message";


    div.innerHTML = text
    .replace(/\n/g,"<br>")
    .replace(
        /(https:\/\/wa\.me\/[0-9]+)/g,
        '<a href="$1" target="_blank" class="whatsapp-link">💬 WhatsApp</a>'
    );


    messages.appendChild(div);


    scrollBottom();


}





// ===============================
// BOT ESCRIBIENDO
// ===============================

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




// ===============================
// QUITAR ESCRIBIENDO
// ===============================

function removeTyping(){


    const t=document.getElementById("typing");


    if(t){

        t.remove();

    }


}




// ===============================
// SCROLL
// ===============================

function scrollBottom(){


    if(messages){

        messages.scrollTop = messages.scrollHeight;

    }

}




// ===============================
// CONEXIÓN N8N
// ===============================

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


            mensaje:question,


            historial:conversation,


            source:"laguer",


            page:window.location.pathname,


            url:window.location.href,


            userAgent:navigator.userAgent,


            language:navigator.language


        })


    });




    if(!response.ok){


        throw new Error(
            "Error n8n: "+response.status
        );


    }




    const data = await response.json();



    console.log(
        "Respuesta n8n:",
        data
    );




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


    console.error(
        "Error:",
        error
    );



    removeTyping();



    addBot(
        "⚠️ No puedo conectar con LAGUER IA.<br>Verifica el servidor."
    );


}



}