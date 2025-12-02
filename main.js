const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
// 定义存储文件的路径：这里存在用户的应用数据目录里，文件名为 notes.md
const DATA_PATH = path.join(app.getPath('userData'), 'notes.md');
//定义存储窗口位置的配置文件路径
const STATE_PATH = path.join(app.getPath('userData'), 'window-state.json');
let mainWindow;
let tray;

function createWindow() {
   // 尝试读取上次保存的窗口状态
  let state = {};
  try {
    if (fs.existsSync(STATE_PATH)) {
      state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.log('读取窗口状态失败，使用默认设置');
  }
  mainWindow = new BrowserWindow({
   //如果读取到了状态，就用读取的，否则用默认值
    width: state.width || 300,
    height: state.height || 400,
    x: state.x, // 如果 state.x 是 undefined，Electron 会自动居中
    y: state.y,
    frame: false, // 无边框，像个便签
    skipTaskbar: true, // 不在底部任务栏显示
    alwaysOnTop: true, // 既然是便签，最好置顶
    webPreferences: {
      // 开启预加载脚本，这是安全通信的桥梁
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // 为了安全，禁用直接 Node 集成
      contextIsolation: true // 开启隔离，这是 preload 生效的关键
    }
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools(); // 开发时可以把这就行注释打开，方便看报错
  // 这里我们在窗口“即将关闭”或者“即将隐藏”时保存状态
  mainWindow.on('close', (e) => {
    saveWindowState();
    // 点击 X 是隐藏而不是退出程序
    e.preventDefault(); 
    mainWindow.hide();
  });
  
  // 监听移动结束事件，实时保存（可选，防止异常退出没保存）
  mainWindow.on('moved', saveWindowState);
  mainWindow.on('resized', saveWindowState);
}
// 封装保存状态的函数
function saveWindowState() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds(); // 获取 x, y, width, height
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(bounds));
  } catch (e) {
    console.error('保存窗口状态失败', e);
  }
}
app.whenReady().then(() => {

  // 渲染进程想要读取文件
  ipcMain.handle('read-file', async () => {
    try {
      // 如果文件不存在，就返回空字符串
      if (!fs.existsSync(DATA_PATH)) {
        return '';
      }
      // 读取文件内容并返回
      return fs.readFileSync(DATA_PATH, 'utf-8');
    } catch (err) {
      console.error(err);
      return '读取出错';
    }
  });

  // ：渲染进程想要保存文件
  ipcMain.on('save-file', (event, content) => {
    try {
      fs.writeFileSync(DATA_PATH, content, 'utf-8');
      console.log('保存成功:', DATA_PATH); // 开发时可以在终端看到路径
    } catch (err) {
      console.error('保存失败', err);
    }
  });
   // --- 监听隐藏窗口的指令 ---
  ipcMain.on('hide-window', () => {
    // 这里的逻辑是：只隐藏，不退出程序
    if (mainWindow) {
      mainWindow.hide();
    }
  });
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
    { label: '退出', click: () => {
      saveWindowState(); // 退出前保存一下位置
      app.quit()
    } }
  ]);
  tray.setToolTip('我的便签');
  tray.setContextMenu(contextMenu);

  // 监听托盘图标的“左键点击”事件
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      // 如果窗口是显示状态，点击图标就隐藏它（可选，看你习惯）
      mainWindow.hide();
    } else {
      // 核心逻辑：如果窗口是隐藏的，就显示出来
      mainWindow.show();
      mainWindow.focus(); // 这一点很重要，确保窗口排在最前面
    }
  });

});

// 防止窗口关闭时程序退出
app.on('window-all-closed', (e) => {
  // e.preventDefault(); 
});