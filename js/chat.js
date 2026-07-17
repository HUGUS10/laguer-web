/* ==========================================
   LAGUER AI CHAT
   Frontend
   Cloudflare API + n8n + D1
========================================== */


const API_CHAT="/api/chat";


// ELEMENTOS

const chatBtn =
document.getElementById("laguerChatBtn");

const chatBox =
document.getElementById("laguerChat");

const closeBtn =
document.getElementById("closeChat");

const sendBtn =
document.getElementById("sendChat");

const input =
document.getElementById("chatInput");

const messages =
document.getElementById("chatMessages");




// MEMORIA CHAT

let conversation =
JSON.parse(
localStorage.getItem("laguer_chat")
)
|| [];




// USUARIO LOGIN D1

function getUser(){


return JSON.parse(

localStorage.getItem("laguerUser")

)
|| null;


}




// ABRIR CHAT

if(chatBtn){


chatBtn.onclick=()=>{


chatBox.classList.add("active");


if(input)
input.focus();


};


}



// CERRAR

if(closeBtn){


closeBtn.onclick=()=>{


chatBox.classList.remove("active");


};


}





// ENTER

if(input){


input.addEventListener(
"keypress",
(e)=>{


if(e.key==="Enter"){


sendMessage();


}


}

);


}




// BOTON ENVIAR


if(sendBtn){


sendBtn.onclick=sendMessage;


}




// ==========================================
// ENVIAR MENSAJE
// ==========================================


async function sendMessage(){


const text =
input.value.trim();



if(!text)return;




addMessage(
text,
"user"
);



input.value="";



showTyping();



conversation.push({

role:"user",

content:text

});



saveConversation();




await sendAI(text);



}






// ==========================================
// CONECTAR API
// ==========================================


async function sendAI(text){



try{



const user =
getUser();




const response =
await fetch(

API_CHAT,

{


method:"POST",


headers:{


"Content-Type":"application/json"


},



body:JSON.stringify({



mensaje:text,


email:user?.email || null,


usuario:user,


historial:conversation,


url:window.location.href


})


}

);





const data =
await response.json();




removeTyping();





const answer =


data.respuesta ||

"Gracias por escribir a LAGUER.";




conversation.push({


role:"assistant",


content:answer


});



saveConversation();




addMessage(

answer,

"bot"

);





}catch(error){



console.error(
"CHAT ERROR:",
error
);



removeTyping();



addMessage(

"⚠️ El asesor LAGUER no está disponible.",

"bot"

);



}


}







// ==========================================
// PINTAR MENSAJES
// ==========================================


function addMessage(text,type){



const div =
document.createElement("div");



div.className =

type==="user"

?

"user-message"

:

"bot-message";





div.innerHTML =
text
.replace(/\n/g,"<br>");




messages.appendChild(div);



messages.scrollTop =
messages.scrollHeight;



}







// ==========================================
// ESCRIBIENDO
// ==========================================


function showTyping(){


removeTyping();


const div =
document.createElement("div");


div.id="typing";


div.className="typing";


div.innerHTML="● ● ●";



messages.appendChild(div);


}






function removeTyping(){


const t =
document.getElementById("typing");


if(t)
t.remove();



}







// ==========================================
// GUARDAR CHAT
// ==========================================


function saveConversation(){



localStorage.setItem(

"laguer_chat",

JSON.stringify(conversation)

);


}