const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
  },
  gemini: {
    run: (data) => ipcRenderer.invoke('run-gemini', data),
  }
  // we can also expose variables, not just functions
})