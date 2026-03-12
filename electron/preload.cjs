const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
  syncGateIo: (apiKey, apiSecret, from, to) => ipcRenderer.invoke('sync-gate-io', apiKey, apiSecret, from, to),
  selectTradeScreenshot: () => ipcRenderer.invoke('select-trade-screenshot'),
  sendNotification: (title, body) => ipcRenderer.invoke('send-notification', title, body),
  // 15C: Auto-update IPC
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, data) => callback(data)),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
