/* ==========================================
   LAGUER AI CHAT
   chat.js
========================================== */

const N8N_WEBHOOK = "https://hugolaban.app.n8n.cloud/webhook/laguer-ai";

const chatBtn = document.getElementById("laguerChatBtn");
const chat = document.getElementById("laguerChat");
const closeBtn = document.getElementById("closeChat");
const sendBtn = document.getElementById("sendChat");
const input = document.getElementById("chatInput");
const messages = document.getElementById("chatMessages");

let conversation = [];

chatBtn.addEventListener("click", () => {
    chat.classList.add("active");
    input.focus();
});

closeBtn.addEventListener("click", () => {
    chat.classList.remove("active");
});

input.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

sendBtn.addEventListener("click", sendMessage);

function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    addUser(text);

    input.value = "";

    typing();

    fetchAI(text);

}

function addUser(text){

    const div = document.createElement("div");

    div.className = "user-message";

    div.innerHTML = text;

    messages.appendChild(div);

    scrollBottom();

}

function addBot(text){

    removeTyping();

    const div = document.createElement("div");

    div.className = "bot-message";

    div.innerHTML = text;

    messages.appendChild(div);

    scrollBottom();

}

function typing(){

    removeTyping();

    const div = document.createElement("div");

    div.className = "typing";

    div.id = "typing";

    div.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    messages.appendChild(div);

    scrollBottom();

}

function removeTyping(){

    const t = document.getElementById("typing");

    if(t) t.remove();

}

function scrollBottom(){

    messages.scrollTop = messages.scrollHeight;

}

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

            throw new Error("Servidor");

        }

        const data = await response.json();

        const answer =
            data.reply ||
            data.response ||
            data.answer ||
            "Lo siento, no encontré una respuesta.";

        conversation.push({

            role:"assistant",
            content:answer

        });

        addBot(answer);

    }catch(e){

        removeTyping();

        addBot("⚠️ No pude conectarme con el asistente. Inténtalo nuevamente.");

        console.error(e);

    }

}