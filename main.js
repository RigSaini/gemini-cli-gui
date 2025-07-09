const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const { spawn } = require('child_process');


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
  ipcMain.handle('ping', () => 'pong')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.handle('run-gemini', async (event, data) => {
  const { prompt, history } = data;
  console.log(`[main.js] run-gemini received prompt: "${prompt}"`);
  return new Promise((resolve, reject) => {
    const nodePath = '/Users/rig.saini/.nvm/versions/node/v22.17.0/bin/node';
    const geminiPath = '/Users/rig.saini/.nvm/versions/node/v22.17.0/lib/node_modules/@google/gemini-cli/dist/index.js';

    const historyAsString = history
      .map(msg => `${msg.sender === "user" ? "User" : "Gemini"}: ${msg.text}`)
      .join('\n');

    const finalPrompt = `${historyAsString}\nUser: ${prompt}\nGemini:`;

    const child = spawn(nodePath, [geminiPath, '--prompt', finalPrompt, '--yolo'], {
      cwd: process.cwd(), // or specify your desired directory
      env: process.env    // inherit environment variables
    });
    
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('[main.js] Gemini stdout:', data.toString());
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[main.js] Gemini stderr:', data.toString());
    });

    child.on('close', (code) => {
      console.log(`[main.js] Gemini process exited with code ${code}`);
      if (code !== 0) {
        return reject(stderr || `Process exited with code ${code}`);
      }
      resolve(stdout.trim());
    });

    child.on('error', (err) => {
      console.error('[main.js] Gemini execution error:', err);
      reject(err.message);
    });

    // Close stdin to prevent hanging
    child.stdin.end();
  });
});

ipcMain.on('run-gemini-stream', (event, data) => {
  const { prompt, history } = data;
  const webContents = event.sender;
  const nodePath = '/Users/rig.saini/.nvm/versions/node/v22.17.0/bin/node';
  const geminiPath = '/Users/rig.saini/.nvm/versions/node/v22.17.0/lib/node_modules/@google/gemini-cli/dist/index.js';

  const historyAsString = history
    .map(msg => `${msg.sender === "user" ? "User" : "Gemini"}: ${msg.text}`)
    .join('\n');
  const finalPrompt = `${historyAsString}\nUser: ${prompt}\nGemini:`;

  const child = spawn(nodePath, [geminiPath, '--prompt', finalPrompt, '--yolo'], {
    cwd: process.cwd(),
    env: process.env
  });

  child.stdout.on('data', (data) => {
    webContents.send('gemini-stream-data', data.toString());
  });

  child.stderr.on('data', (data) => {
    webContents.send('gemini-stream-error', data.toString());
  });

  child.on('close', (code) => {
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