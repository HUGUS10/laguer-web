/* ==========================================
   LAGUER AI CHAT FRONTEND
   js/chat.js
========================================== */


const API_CHAT = "/api/chat";


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



// MEMORIA LOCAL

let conversation =
JSON.parse(
localStorage.getItem("laguer_chat")
) || [];



// USUARIO LOGIN

function getUser(){

return JSON.parse(
localStorage.getItem("laguerUser")
) || null;

}



// ABRIR CHAT

if(chatBtn){

chatBtn.onclick=()=>{

chatBox.classList.add("active");

input.focus();

};

}



// CERRAR CHAT

if(closeBtn){

closeBtn.onclick=()=>{

chatBox.classList.remove("active");

};

}



// ENTER

if(input){

input.addEventListener(
"keydown",
(e)=>{

if(e.key==="Enter"){

sendMessage();

}

});

}



// BOTON ENVIAR

if(sendBtn){

sendBtn.onclick=sendMessage;

}




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



await askLaguer(text);


}




async function askLaguer(text){


try{


const user=getUser();



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

usuario:user,

historial:conversation

})

});



const data =
await response.json();



removeTyping();



const answer =
data.respuesta ||
"Disculpa, no pude responder.";



conversation.push({

role:"assistant",

content:answer

});



saveConversation();



addMessage(
answer,
"bot"
);



}

catch(error){


console.error(
"CHAT ERROR",
error
);



removeTyping();



addMessage(
"⚠️ Error de conexión con LAGUER IA",
"bot"
);


}


}




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
text.replace(
/\n/g,
"<br>"
);



messages.appendChild(div);



messages.scrollTop =
messages.scrollHeight;


}




function showTyping(){


const div =
document.createElement("div");


div.id="typing";

div.className="typing";


div.innerHTML =
"● ● ●";


messages.appendChild(div);


}




function removeTyping(){


const t =
document.getElementById(
"typing"
);


if(t)t.remove();


}




function saveConversation(){


localStorage.setItem(

"laguer_chat",

JSON.stringify(conversation)

);


}