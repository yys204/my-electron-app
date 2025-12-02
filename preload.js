const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 暴露一个 readNote 方法，调用主进程的 read-file
  readNote: () => ipcRenderer.invoke('read-file'),
  
  // 暴露一个 saveNote 方法，调用主进程的 save-file
  saveNote: (content) => ipcRenderer.send('save-file', content),
   // --- 隐藏窗口 ---
  hideWindow: () => ipcRenderer.send('hide-window') 
});