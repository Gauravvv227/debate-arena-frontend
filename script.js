

const startBtn = document.getElementById("start-btn");
const topicInput = document.getElementById("topic-input");
const arena = document.getElementById("arena");
const forArguments = document.getElementById("for-arguments");
const againstArguments = document.getElementById("against-arguments");
const history = [];

startBtn.addEventListener("click", startDebate);

async function startDebate() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        alert("Please enter a topic first!");
        return;
    }

    arena.style.display = "grid";
    forArguments.innerHTML = "";
    againstArguments.innerHTML = "";
    startBtn.disabled = true;
    startBtn.textContent = "Debating...";

    document.getElementById("case-title").textContent = `"${topic}"`;
    document.getElementById("speaker-for").classList.add("revealed");
    document.getElementById("speaker-against").classList.add("revealed");
    document.getElementById("case-banner").classList.add("revealed");

    for (let round = 1; round <= 3; round++) {
        await makeArgument(topic, "for", round);
        await makeArgument(topic, "against", round);
    }

    startBtn.disabled = false;
    startBtn.textContent = "Start Debate";
}

async function makeArgument(topic, side, round) {
    const container = side === "for" ? forArguments : againstArguments;

    const div = document.createElement("div");
    div.className = "argument";
    div.innerHTML = `<div class="round-label">Round ${round}</div><span></span>`;
    container.appendChild(div);
    const textSpan = div.querySelector("span");

    
    

    const response = await fetch("https://debate-arena-fxvd.onrender.com/api/argument", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            topic: topic,
            side: side,
            round: round,
            history: history
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop();

    const dataLines = lines.filter(line => line.startsWith("data: "));

    for (const line of dataLines) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
            const parsed = JSON.parse(data);
            const token = parsed.choices[0]?.delta?.content || "";
            textSpan.textContent += token;
        } catch { console.log("broken piece:", data); }
    }
}

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.startsWith("data: "));
        
        for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            
            try {
                const parsed = JSON.parse(data);
                const token = parsed.choices[0]?.delta?.content || "";
                textSpan.textContent += token;
            } catch {}
        }
    }
    history.push({ side, round, text: textSpan.textContent });
}