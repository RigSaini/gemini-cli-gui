const chatHistory = document.getElementById("chatHistory");
const input = document.getElementById("prompt");
const button = document.getElementById("submit");
//const outputArea = document.getElementById("outputArea");

let chatHistoryArray = [];

function addMessage(text, sender) {
  const div = document.createElement("div");

  if (sender === "user") {
    div.className = "self-end bg-[#0078d7] text-white px-4 py-2 rounded-[16px_16px_0_16px] max-w-[70%] break-words whitespace-pre-wrap";
  } else {
    div.className = "self-start bg-[#2a2a2a] text-white px-4 py-2 rounded-[16px_16px_16px_0] max-w-[70%] break-words whitespace-pre-wrap mb-[18px] last:mb-0";
  }

  div.textContent = text;
  chatHistory.appendChild(div);
  div.scrollIntoView({ behavior: "smooth" });

  chatHistoryArray.push({ sender, text });
}

button.addEventListener("click", () => {
  const prompt = input.value.trim();
  if (!prompt) return;

  addMessage(prompt, "user");
  input.value = "";

  // Create a new bot message bubble for streaming
  const botDiv = document.createElement("div");
  botDiv.className = "self-start bg-[#2a2a2a] text-white px-4 py-2 rounded-[16px_16px_16px_0] max-w-[70%] break-words whitespace-pre-wrap mb-[18px] last:mb-0";
  botDiv.textContent = "";
  chatHistory.appendChild(botDiv);
  botDiv.scrollIntoView({ behavior: "smooth" });

  let fullText = "";

  // Remove any previous listeners for this stream
  window.api.gemini.removeAllStreamListeners?.();

  // Start streaming
  window.api.gemini.runStream({
    prompt,
    history: chatHistoryArray
  });

  // Define handlers that close over this botDiv
  const onData = (chunk) => {
    fullText += chunk;
    botDiv.textContent = fullText;
    botDiv.scrollIntoView({ behavior: "smooth" });
  };
  const onError = (err) => {
    botDiv.textContent += "\n⚠️ Error: " + err;
  };
  const onEnd = () => {
    chatHistoryArray.push({ sender: "bot", text: fullText });
    // Remove listeners after stream ends
    window.api.gemini.offStreamData(onData);
    window.api.gemini.offStreamError(onError);
    window.api.gemini.offStreamEnd(onEnd);
  };

  // Register listeners for this stream only
  window.api.gemini.onStreamData(onData);
  window.api.gemini.onStreamError(onError);
  window.api.gemini.onStreamEnd(onEnd);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    button.click();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
});

const newChatBtn = document.getElementById("newChat");

newChatBtn.addEventListener("click", (e) => {
  e.preventDefault();
  // Clear chat history UI
  chatHistory.innerHTML = "";
  // Clear chat history array
  chatHistoryArray = [];
  // Optionally clear the input box
  input.value = "";
  // Optionally reset textarea height
  input.style.height = "auto";
});

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarLabels = document.querySelectorAll('.sidebar-label');
const n7Logo = document.getElementById('n7Logo');

function setSidebarState() {
  const isCollapsed = sidebar.classList.contains('collapsed') || window.innerWidth < 768;
  if (isCollapsed) {
    sidebar.classList.add('!w-14');
    sidebar.classList.remove('!w-52');
    sidebarLabels.forEach(label => label.classList.add('hidden'));
    n7Logo.classList.add('hidden');
    sidebarToggle.classList.remove('hidden');
    sidebarToggle.classList.add('flex');
  } else {
    sidebar.classList.remove('!w-14');
    sidebar.classList.add('!w-52');
    sidebarLabels.forEach(label => label.classList.remove('hidden'));
    n7Logo.classList.remove('hidden');
    sidebarToggle.classList.remove('hidden');
    sidebarToggle.classList.add('md:flex');
  }
}

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  setSidebarState();
});

window.addEventListener('resize', setSidebarState);
setSidebarState();