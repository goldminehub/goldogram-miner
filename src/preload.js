const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('miner', {
  start: (opts) => ipcRenderer.invoke('start-mining', opts),
  stop: () => ipcRenderer.invoke('stop-mining'),
  getCores: () => ipcRenderer.invoke('get-cores'),
  onMessage: (cb) => ipcRenderer.on('miner-message', (_, msg) => cb(msg)),
});
