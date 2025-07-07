const chatHistory = document.getElementById("chatHistory");
const input = document.getElementById("prompt");
const button = document.getElementById("submit");
//const outputArea = document.getElementById("outputArea");

let chatHistoryArray = [];

function addMessage(text, sender) {
  console.log(`[renderer.js] addMessage called with sender: ${sender}, text: ${text}`);
  const div = document.createElement("div");

  if (sender === "user") {
    div.className = "user-msg";
  } else {
    div.className = "bot-msg";
  }

  div.textContent = text;
  chatHistory.appendChild(div);
  div.scrollIntoView({ behavior: "smooth" });

  chatHistoryArray.push({ sender, text});
}

button.addEventListener("click", async () => {
  console.log("[renderer.js] Send button clicked.");
  const prompt = input.value.trim();
  if (!prompt) {
    console.log("[renderer.js] Prompt is empty, returning.");
    return;
  }

  addMessage(prompt, "user");
  input.value = "";

  try {
    console.log(`[renderer.js] Calling window.api.gemini.run with prompt: "${prompt}"`);
    const response = await window.api.gemini.run({
      prompt,
      history: chatHistoryArray
    }); // real CLI call
    console.log("[renderer.js] Received response from main process:", response);
    addMessage(response, "bot");
    //outputArea.textContent += `> ${prompt}\n${response}\n\n`;
  } catch (err) {
    console.error("[renderer.js] Error calling window.api.gemini.run:", err);
    addMessage("⚠️ Error: " + err, "bot");
    //outputArea.textContent += `> ${prompt}
//⚠️ ${err}

//`;
  }
});