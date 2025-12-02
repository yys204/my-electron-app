const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 400,
    frame: false, // 无边框，像个便签
    skipTaskbar: true, // 不在底部任务栏显示
    alwaysOnTop: true, // 既然是便签，最好置顶
    webPreferences: {
      nodeIntegration: true, // 允许在页面里使用 Node 能力(生产环境建议用preload)
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  // 1. 注册全局快捷键 (比如 Ctrl+Space)
  globalShortcut.register('Ctrl+Space', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus(); // 呼出时获得焦点
    }
  });

  // 2. 创建托盘图标 (保证后台运行)
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: '退出', click: () => app.quit() }
  ]);
  tray.setToolTip('我的便签');
  tray.setContextMenu(contextMenu);
});

// 防止窗口关闭时程序退出
app.on('window-all-closed', (e) => {
  e.preventDefault(); 
});