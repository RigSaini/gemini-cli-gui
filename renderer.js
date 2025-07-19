const chatHistory = document.getElementById("chatHistory");
const input = document.getElementById("prompt");
const button = document.getElementById("submit");
const chatHistoryList = document.getElementById("chatHistoryList");
//const outputArea = document.getElementById("outputArea");

let chatHistoryArray = [];
let currentChatId = null;
let chats = [];

// Load chats on startup
async function loadChats() {
  try {
    chats = await window.api.chats.loadChats();
    renderChatHistory();
  } catch (error) {
    console.error('Error loading chats:', error);
  }
}

// Delete a chat
async function deleteChat(chatId, event) {
  event.stopPropagation(); // Prevent triggering the chat load
  
  try {
    await window.api.chats.deleteChat(chatId);
    
    // If we're deleting the current chat, clear the interface
    if (currentChatId === chatId) {
      currentChatId = null;
      chatHistoryArray = [];
      chatHistory.innerHTML = '';
      input.value = '';
      input.style.height = "auto";
    }
    
    // Reload the chat list
    await loadChats();
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
}

// Make deleteChat globally accessible
window.deleteChat = deleteChat;

// Render chat history in sidebar
function renderChatHistory() {
  chatHistoryList.innerHTML = '';
  
  chats.forEach(chat => {
    const chatItem = document.createElement('div');
    chatItem.className = 'sidebar-btn flex items-center justify-center md:justify-start h-10 rounded-lg hover:bg-gray-700 transition-all duration-200 mx-auto md:mx-0 w-full cursor-pointer relative group';
    chatItem.innerHTML = `
      <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
      <span class="sidebar-label ml-3 truncate flex-1">${chat.title || 'New Chat'}</span>
      <button class="delete-btn opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-600 rounded" data-chat-id="${chat.id}">
        <svg class="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    `;
    
    // Add click event for loading chat
    chatItem.addEventListener('click', () => loadChat(chat.id));
    
    // Add click event for delete button
    const deleteBtn = chatItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (event) => deleteChat(chat.id, event));
    
    chatHistoryList.appendChild(chatItem);
  });
}

// Load a specific chat
async function loadChat(chatId) {
  try {
    const chat = await window.api.chats.loadChat(chatId);
    if (chat) {
      currentChatId = chatId;
      chatHistoryArray = chat.messages;
      
      // Clear and reload chat history
      chatHistory.innerHTML = '';
      chatHistoryArray.forEach(msg => {
        addMessage(msg.text, msg.sender);
      });
    }
  } catch (error) {
    console.error('Error loading chat:', error);
  }
}

// Create a new chat
async function createNewChat() {
  console.log('createNewChat called');
  currentChatId = null;
  chatHistoryArray = [];
  chatHistory.innerHTML = '';
  input.value = '';
  input.style.height = "auto";
  
  // Create a new chat entry without a title initially
  const newChat = {
    title: null, // Use null instead of empty string to indicate no title
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  try {
    console.log('Saving new chat:', newChat);
    const chatId = await window.api.chats.saveChat(newChat);
    currentChatId = chatId;
    console.log('New chat created with ID:', chatId);
    await loadChats(); // Refresh the chat list
  } catch (error) {
    console.error('Error creating new chat:', error);
  }
}

// Save current chat
async function saveCurrentChat() {
  console.log('saveCurrentChat called with:', { currentChatId, chatHistoryArrayLength: chatHistoryArray.length });
  
  if (currentChatId && chatHistoryArray.length > 0) {
    try {
      // Find existing chat in local array
      let existingChat = chats.find(chat => chat.id === currentChatId);
      console.log('Existing chat found:', existingChat);
      
      // If not found locally, try to load it from storage
      if (!existingChat) {
        console.log('Chat not found locally, loading from storage...');
        existingChat = await window.api.chats.loadChat(currentChatId);
        if (existingChat) {
          chats.push(existingChat);
          console.log('Loaded chat from storage:', existingChat);
        }
      }
      
      // Determine if we should set a new title
      const hasTitle = existingChat?.title && existingChat.title.trim() !== '' && existingChat.title !== null;
      console.log('Has title:', hasTitle, 'Existing title:', existingChat?.title);
      
      let title = '';
      
      if (!hasTitle && chatHistoryArray.length >= 1) {
        // Use the first user message as title
        const firstUserMessage = chatHistoryArray.find(msg => msg.sender === 'user');
        title = firstUserMessage?.text?.substring(0, 30) || 'New Chat';
        console.log('Setting new title:', title, 'from message:', firstUserMessage?.text);
      } else {
        // Keep existing title
        title = existingChat?.title || 'New Chat';
        console.log('Keeping existing title:', title);
      }
      
      const chatData = {
        id: currentChatId,
        title: title,
        messages: chatHistoryArray,
        createdAt: existingChat?.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      console.log('Saving chat data:', chatData);
      await window.api.chats.saveChat(chatData);
      
      // Update the local chats array
      const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
      if (chatIndex !== -1) {
        chats[chatIndex] = chatData;
        console.log('Updated existing chat in local array');
      } else {
        chats.push(chatData);
        console.log('Added new chat to local array');
      }
      
      // Re-render the chat list to show updated titles
      renderChatHistory();
      console.log('Chat saved with title:', title);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  } else {
    console.log('saveCurrentChat skipped - no currentChatId or empty chatHistoryArray');
  }
}

function addMessage(text, sender) {
  const div = document.createElement("div");

  if (sender === "user") {
    div.className = "self-end bg-[#0078d7] text-white px-4 py-2 rounded-[16px_16px_0_16px] max-w-[70%] break-words whitespace-pre-wrap";
    div.textContent = text;
  } else {
    div.className = "self-start bg-[#2a2a2a] text-white px-4 py-2 rounded-[16px_16px_16px_0] max-w-[70%] break-words whitespace-pre-wrap mb-[18px] last:mb-0";
    // Parse markdown for bot messages so saved chats display with formatting
    div.innerHTML = marked.parse(text);
  }

  chatHistory.appendChild(div);
  div.scrollIntoView({ behavior: "smooth" });

  chatHistoryArray.push({ sender, text });
}

button.addEventListener("click", () => {
  const prompt = input.value.trim();
  if (!prompt) return;

  addMessage(prompt, "user");
  input.value = "";

  // Save the chat immediately after adding the user message
  saveCurrentChat();

  // Create a new bot message bubble for streaming (now as HTML)
  const botDiv = document.createElement("div");
  botDiv.className = "self-start bg-[#2a2a2a] text-white px-4 py-2 rounded-[16px_16px_16px_0] max-w-[70%] break-words whitespace-pre-wrap mb-[18px] last:mb-0";
  botDiv.innerHTML = "";
  chatHistory.appendChild(botDiv);
  botDiv.scrollIntoView({ behavior: "smooth" });

  let fullText = "";
  let hasResponseStarted = false;
  let startTime = Date.now();
  let thinkingInterval;

  // Start thinking indicator
  const updateThinkingIndicator = () => {
    if (!hasResponseStarted) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      botDiv.innerHTML = `<span class="text-pink-300">Thinking... ${elapsed}s</span>`;
    }
  };
  
  updateThinkingIndicator();
  thinkingInterval = setInterval(updateThinkingIndicator, 1000);

  // Remove any previous listeners for this stream
  window.api.gemini.removeAllStreamListeners?.();

  // Start streaming with chat context
  window.api.gemini.runStream({
    prompt,
    history: chatHistoryArray,
    chatId: currentChatId
  });

  // Define handlers that close over this botDiv
  const appendAndRender = (chunk, type = 'stdout') => {
    if (!hasResponseStarted) {
      hasResponseStarted = true;
      clearInterval(thinkingInterval);
      fullText = ""; // Reset fullText since we're starting fresh
    }
    fullText += chunk;
    
    // Debug: log the raw text to see what we're getting
    console.log('Raw fullText:', fullText);
    
    // Parse markdown and add some basic styling for lists
    const parsedHtml = marked.parse(fullText);
    console.log('Parsed HTML:', parsedHtml);
    
    botDiv.innerHTML = parsedHtml;
    botDiv.scrollIntoView({ behavior: "smooth" });
  };
  const onEnd = () => {
    clearInterval(thinkingInterval);
    chatHistoryArray.push({ sender: "bot", text: fullText });
    saveCurrentChat();
    window.api.gemini.offStreamData(onDataWrapper);
    window.api.gemini.offStreamError(onErrorWrapper);
    window.api.gemini.offStreamEnd(onEnd);
  };

  // Wrappers to distinguish between stdout and stderr
  const onDataWrapper = (chunk) => appendAndRender(chunk, 'stdout');
  const onErrorWrapper = (chunk) => appendAndRender(chunk, 'stderr');

  window.api.gemini.onStreamData(onDataWrapper);
  window.api.gemini.onStreamError(onErrorWrapper);
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
  createNewChat();
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

// Initialize chat system
document.addEventListener('DOMContentLoaded', async () => {
  await loadChats();
  
  // Create a default chat if no chats exist
  if (chats.length === 0) {
    await createNewChat();
  }
});