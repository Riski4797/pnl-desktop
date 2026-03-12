import { app, BrowserWindow, ipcMain, dialog, clipboard, protocol, net, session, Notification } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath, pathToFileURL } from 'url';
import Store from 'electron-store';
import { fetchGateIoTrades } from './gate_api.js';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';
const store = new Store();

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Register as privileged BEFORE app is ready to ensure fetch API and CSP bypass works correctly
protocol.registerSchemesAsPrivileged([
  { scheme: 'local', privileges: { secure: true, standard: true, supportFetchAPI: true, bypassCSP: true } }
]);

app.whenReady().then(() => {
  // Relax CSP to allow local:// protocol for images
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: local: http: https: ws: wss:; img-src 'self' data: local: https: http:;"]
      }
    });
  });

  // Register local:// protocol to serve local images securely
  protocol.handle('local', (request) => {
    try {
      // Decode the URL (e.g., local://C:/Users/...)
      const decodedUrl = decodeURIComponent(request.url.replace(/^local:\/\//, ''));
      
      // On Windows, fix the leading slash before drive letter if it exists (e.g. /C:/ -> C:/)
      const filePath = decodedUrl.replace(/^\/([a-zA-Z]:)/, '$1');
        
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (error) {
      console.error('Failed to handle local:// protocol request:', error);
      return new Response(null, { status: 404 });
    }
  });

  // IPC for electron-store
  ipcMain.handle('store-get', (event, key) => {
    return store.get(key);
  });
  
  ipcMain.handle('store-set', (event, key, value) => {
    store.set(key, value);
    return true;
  });

  // Gate.io API Sync Handle
  ipcMain.handle('sync-gate-io', async (event, apiKey, apiSecret, fromTimestamp, toTimestamp) => {
    try {
      const data = await fetchGateIoTrades(apiKey, apiSecret, fromTimestamp, toTimestamp);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Screenshot attachment for trades
  ipcMain.handle('select-trade-screenshot', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    
    const srcPath = result.filePaths[0];
    const screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
    await fs.ensureDir(screenshotsDir);
    
    const fileName = `trade_${Date.now()}${path.extname(srcPath)}`;
    const destPath = path.join(screenshotsDir, fileName);
    await fs.copy(srcPath, destPath);
    
    return destPath;
  });

  // Desktop notifications
  ipcMain.handle('send-notification', (event, title, body) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
    return true;
  });

  createWindow();

  // 15B: Auto-update (production only)
  if (!isDev) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    const sendUpdateStatus = (status, info = {}) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-status', { status, ...info });
      }
    };

    autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking'));
    autoUpdater.on('update-available', (info) => sendUpdateStatus('available', { version: info.version }));
    autoUpdater.on('update-not-available', () => sendUpdateStatus('not-available'));
    autoUpdater.on('download-progress', (progress) => sendUpdateStatus('downloading', { percent: Math.round(progress.percent) }));
    autoUpdater.on('update-downloaded', (info) => sendUpdateStatus('downloaded', { version: info.version }));
    autoUpdater.on('error', (err) => sendUpdateStatus('error', { message: err.message }));

    // Check for updates after 3 seconds
    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
  }

  // 15B: IPC handler to install update
  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle('get-app-version', () => app.getVersion());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
