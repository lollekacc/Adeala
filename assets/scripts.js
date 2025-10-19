// ===== HEADER SCROLL EFFECT =====
window.addEventListener("scroll", () => {
  const header = document.getElementById("mainHeader");
  if (header) header.classList.toggle("shrink", window.scrollY > 120);
});

// ===== LOAD HEADER, FOOTER & CHAT =====
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const header = await fetch("partials/header.html").then(r => r.text());
    document.getElementById("header-placeholder").innerHTML = header;
  } catch {}

  try {
    const footer = await fetch("partials/footer.html").then(r => r.text());
    document.body.insertAdjacentHTML("beforeend", footer);
  } catch {}

  try {
    const chat = await fetch("partials/chat.html").then(r => r.text());
    document.body.insertAdjacentHTML("beforeend", chat);
    initChat();
  } catch {
    console.error("Chat not found");
  }
});

// ===== AI CHAT SYSTEM =====
function initChat() {
  const chatBox = document.getElementById("chatBox");
  const chatBody = document.getElementById("chatBody");
  const chatInput = document.getElementById("freeSearch");
  const chatBtn = document.getElementById("chatSend");
  const minimizeBtn = document.querySelector(".minimize-btn");

  if (!chatBox || !chatBody || !chatInput || !chatBtn) return;

  minimizeBtn?.addEventListener("click", () => {
    chatBox.classList.toggle("minimized");
  });

  // ----- SMART LOCAL REPLIES -----
  const smartLocalReply = (msg) => {
    msg = msg.toLowerCase().trim();
    if (/^hej|hejsan|tja|hello|hi/.test(msg))
      return "Hej där! 👋 Hur kan jag hjälpa dig idag?";
    if (/hur mår du|how are you/.test(msg))
      return "Jag mår bra tack! 😊 Hur är det med dig?";
    if (/hjälp|vad kan du/.test(msg))
      return "Jag kan hjälpa dig med abonnemang, quiz, erbjudanden och kundservicefrågor!";
    if (/tack/.test(msg))
      return "Varsågod! 🙌 Jag finns här om du behöver mer hjälp.";
    return null;
  };

  // ----- RENDER CHAT BUBBLES -----
  const addMessage = (msg, type = "bot") => {
    msg = msg.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      `<a href='$2' target='_blank' class='chat-link'>$1</a>`);

    const replacements = {
      "quiz-mobil-start.html": "📱 Starta mobilquiz",
      "quiz-familj-start.html": "👨‍👩‍👧 Starta familjequiz",
      "quiz-bredband.html": "🌐 Starta bredbandsquiz",
      "erbjudande.html": "💎 Visa aktuella erbjudanden",
      "kundservice.html": "📞 Kontakta kundservice",
      "om-oss.html": "ℹ️ Läs mer om Adeala"
    };
    Object.entries(replacements).forEach(([file, label]) => {
      const re = new RegExp(file, "gi");
      msg = msg.replace(re, `<a href='${file}' class='chat-link' target='_blank'>${label}</a>`);
    });

    const div = document.createElement("div");
    div.className = type === "user" ? "user-message" : "bot-message";
    div.innerHTML = `<p>${msg}</p>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  };

  // ----- OPERATOR DETECTION -----
  const detectOperators = (text) => {
    const t = text.toLowerCase();
    const defs = [
      { name: "Telia", slug: "telia", re: /\btelia\b/i },
      { name: "Telenor", slug: "telenor", re: /\btelenor\b/i },
      { name: "Tele2", slug: "tele2", re: /\btele2\b/i },
      { name: "Tre", slug: "tre", re: /\btre\b/i },
      { name: "Halebop", slug: "halebop", re: /\bhalebop\b/i },
    ];
    return defs.filter(d => d.re.test(t));
  };

  // ----- HANDLE SEND -----
  const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    chatInput.value = "";

    // 1️⃣ Operator referral first
    const ops = detectOperators(text);
    if (ops.length > 0) {
      if (ops.length === 1) {
        const o = ops[0];
        addMessage(
          `Självklart! Här är en direktlänk: <a href="erbjudande.html#${o.slug}" class="chat-link" target="_blank">🔗 Visa ${o.name}-erbjudanden</a>`,
          "bot"
        );
      } else {
        const buttons = ops.map(o =>
          `<a href="erbjudande.html#${o.slug}" class="chat-link" target="_blank">🔗 ${o.name}</a>`
        ).join(" ");
        addMessage(`Jag hittade flera operatörer – välj en:<br>${buttons}`, "bot");
      }
      return;
    }

    // 2️⃣ Try local quick replies
    const local = smartLocalReply(text);
    if (local) {
      setTimeout(() => addMessage(local, "bot"), 300);
      return;
    }

    // 3️⃣ AI backend reply
    addMessage("⏳ Tänker...", "bot");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const last = chatBody.lastChild;
      if (last && last.textContent.includes("Tänker")) last.remove();
      addMessage(data.reply || "Jag hittade inget direkt svar 😅", "bot");
    } catch {
      addMessage("Oj, jag kunde inte hämta svar just nu. Försök igen!", "bot");
    }
  };

  chatBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

// ===== WAIT UNTIL CHAT IS IN DOM =====
function waitForChat() {
  if (document.getElementById("chatSend")) {
    initChat();
  } else {
    setTimeout(waitForChat, 200);
  }
}
waitForChat();
