const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let minerProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (minerProcess) minerProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('start-mining', (event, { address, cores, mode, url }) => {
  if (minerProcess) return { error: 'Already mining' };
  
  const binaryPath = path.join(
    app.isPackaged ? process.resourcesPath : path.join(__dirname, '../goldogram-miner-core/target/release'),
    'goldogram-miner-core'
  );

  minerProcess = spawn(binaryPath, [
    '--address', address,
    '--url', url || 'https://goldminequant.org',
    '--cores', String(cores || 4),
    '--mode', mode || 'solo',
  ]);

  minerProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      try {
        const msg = JSON.parse(line);
        mainWindow?.webContents.send('miner-message', msg);
      } catch {}
    });
  });

  minerProcess.on('exit', () => {
    minerProcess = null;
    mainWindow?.webContents.send('miner-message', { type: 'stopped' });
  });

  return { ok: true };
});

ipcMain.handle('stop-mining', () => {
  if (minerProcess) {
    minerProcess.kill();
    minerProcess = null;
  }
  return { ok: true };
});

ipcMain.handle('get-cores', () => {
  return require('os').cpus().length;
});
