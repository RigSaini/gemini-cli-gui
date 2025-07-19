const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// Chat storage
let chats = new Map();
let currentChatId = null;

// Get chat storage file path
const getChatsFilePath = () => {
  const userDataPath = path.join(os.homedir(), '.gemini-gui-chats.json');
  return userDataPath;
};

// Load chats from file
const loadChatsFromFile = () => {
  try {
    const filePath = getChatsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const loadedChats = JSON.parse(data);
      chats = new Map(Object.entries(loadedChats));
    }
  } catch (error) {
    console.error('Error loading chats:', error);
  }
};

// Save chats to file
const saveChatsToFile = () => {
  try {
    const filePath = getChatsFilePath();
    const chatsObject = Object.fromEntries(chats);
    fs.writeFileSync(filePath, JSON.stringify(chatsObject, null, 2));
  } catch (error) {
    console.error('Error saving chats:', error);
  }
};

// Generate unique chat ID
const generateChatId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile('index.html')
  //win.webContents.openDevTools()
}

app.whenReady().then(() => {
  // Load existing chats
  loadChatsFromFile();
  
  ipcMain.handle('ping', () => 'pong')
  
  // Chat management handlers
  ipcMain.handle('save-chat', async (event, chatData) => {
    const chatId = chatData.id || generateChatId();
    chats.set(chatId, {
      id: chatId,
      title: chatData.title === null ? null : (chatData.title || 'New Chat'),
      messages: chatData.messages || [],
      createdAt: chatData.createdAt || Date.now(),
      updatedAt: Date.now()
    });
    saveChatsToFile();
    return chatId;
  });

  ipcMain.handle('load-chats', async () => {
    return Array.from(chats.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  });

  ipcMain.handle('load-chat', async (event, chatId) => {
    return chats.get(chatId) || null;
  });

  ipcMain.handle('delete-chat', async (event, chatId) => {
    chats.delete(chatId);
    saveChatsToFile();
    return true;
  });

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.on('run-gemini-stream', (event, data) => {
  const { prompt, history, chatId } = data;
  const webContents = event.sender;
  const nodePath = '/Users/rig.saini/.nvm/versions/node/v22.17.0/bin/node';
  const geminiPath = '/Users/rig.saini/.nvm/versions/node/v22.17.0/lib/node_modules/@google/gemini-cli/dist/index.js';

  // Update current chat ID
  currentChatId = chatId;

  const historyAsString = history
    .map(msg => `${msg.sender === "user" ? "User" : "Gemini"}: ${msg.text}`)
    .join('\n');
  const finalPrompt = `${historyAsString}\nUser: ${prompt}\nGemini:`;

  const child = spawn(nodePath, [geminiPath, '--prompt', finalPrompt, '--yolo'], {
    cwd: process.cwd(),
    env: process.env
  });

  let responseText = '';

  child.stdout.on('data', (data) => {
    const chunk = data.toString();
    responseText += chunk;
    webContents.send('gemini-stream-data', chunk);
  });

  child.stderr.on('data', (data) => {
    webContents.send('gemini-stream-error', data.toString());
  });

  child.on('close', (code) => {
    // Save the updated chat with the new message and response
    if (currentChatId && chats.has(currentChatId)) {
      const chat = chats.get(currentChatId);
      chat.messages.push(
        { sender: 'user', text: prompt },
        { sender: 'bot', text: responseText }
      );
      chat.updatedAt = Date.now();
      saveChatsToFile();
    }
    webContents.send('gemini-stream-end', code);
  });

  child.on('error', (err) => {
    webContents.send('gemini-stream-error', err.message);
  });

  child.stdin.end();
});

app.on('window-all-closed', () => {
  app.quit()
})