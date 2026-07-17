/* ==========================================
 LAGUER AI CHAT
 js/chat.js
========================================== */


const API_CHAT="/api/chat";


const chatBtn=document.getElementById(
"laguerChatBtn"
);

const chatBox=document.getElementById(
"laguerChat"
);

const closeBtn=document.getElementById(
"closeChat"
);

const sendBtn=document.getElementById(
"sendChat"
);

const input=document.getElementById(
"chatInput"
);

const messages=document.getElementById(
"chatMessages"
);



let conversation =
JSON.parse(
localStorage.getItem("laguer_chat")
)||[];




function getUser(){

return JSON.parse(
localStorage.getItem("laguerUser")
)||null;

}





chatBtn?.addEventListener(
"click",
()=>{

chatBox.classList.add("active");

input.focus();

});




closeBtn?.addEventListener(
"click",
()=>{

chatBox.classList.remove("active");

});





input?.addEventListener(
"keydown",
(e)=>{

if(e.key==="Enter"){

sendMessage();

}

});





sendBtn?.addEventListener(
"click",
sendMessage
);







async function sendMessage(){


const text=input.value.trim();


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




try{


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

usuario:getUser(),

historial:conversation


})

});




const data =
await response.json();



removeTyping();



const answer =
data.respuesta ||
"Sin respuesta";



conversation.push({

role:"assistant",

content:answer

});



localStorage.setItem(

"laguer_chat",

JSON.stringify(conversation)

);



addMessage(
answer,
"bot"
);



}

catch(e){


removeTyping();


addMessage(
"⚠️ Error conectando con LAGUER IA",
"bot"
);


console.error(e);


}


}






function addMessage(text,type){


const div=document.createElement(
"div"
);


div.className =
type==="user"
?
"user-message"
:
"bot-message";



div.innerHTML =
text.replace(/\n/g,"<br>");



messages.appendChild(div);


messages.scrollTop=
messages.scrollHeight;


}




function showTyping(){


const div=document.createElement(
"div"
);


div.id="typing";

div.className="typing";

div.innerHTML="● ● ●";


messages.appendChild(div);


}




function removeTyping(){


const t=document.getElementById(
"typing"
);


if(t)t.remove();


}