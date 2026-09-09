const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('auroraNative', {
  isElectron: true,
  netRequest: (opts) => ipcRenderer.invoke('net:request', opts),
  onOpenInTab: (cb) => {
    const listener = (_event, url) => cb(url);
    ipcRenderer.on('aurora:open-in-tab', listener);
    return () => ipcRenderer.removeListener('aurora:open-in-tab', listener);
  },
  onDownloadImage: (cb) => {
    const listener = (_event, url) => cb(url);
    ipcRenderer.on('aurora:download-image', listener);
    return () => ipcRenderer.removeListener('aurora:download-image', listener);
  },
  onDownloadReceipt: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('aurora:download-ready', listener);
    return () => ipcRenderer.removeListener('aurora:download-ready', listener);
  },
});