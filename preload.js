const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
  },
  gemini: {
    run: (data) => ipcRenderer.invoke('run-gemini', data),
    runStream: (data) => ipcRenderer.send('run-gemini-stream', data),
    onStreamData: (callback) => ipcRenderer.on('gemini-stream-data', (event, chunk) => callback(chunk)),
    onStreamError: (callback) => ipcRenderer.on('gemini-stream-error', (event, err) => callback(err)),
    onStreamEnd: (callback) => ipcRenderer.on('gemini-stream-end', (event, code) => callback(code)),
    offStreamData: (callback) => ipcRenderer.removeListener('gemini-stream-data', callback),
    offStreamError: (callback) => ipcRenderer.removeListener('gemini-stream-error', callback),
    offStreamEnd: (callback) => ipcRenderer.removeListener('gemini-stream-end', callback),
    removeAllStreamListeners: () => {
      ipcRenderer.removeAllListeners('gemini-stream-data');
      ipcRenderer.removeAllListeners('gemini-stream-error');
      ipcRenderer.removeAllListeners('gemini-stream-end');
    }
  }
})