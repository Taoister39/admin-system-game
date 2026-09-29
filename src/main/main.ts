import path from 'node:path';
import { BrowserWindow, app, ipcMain } from 'electron';
import { createSaveStore } from './saveStore';

const root = path.join(__dirname, '..');
const developmentUrl = process.env.RSBUILD_DEV_SERVER_URL;
const testDirectory = process.env.TOWN_OFFICE_TEST_DATA;
if (!app.isPackaged && testDirectory && path.isAbsolute(testDirectory)) {
  app.setPath('userData', testDirectory);
}
const windows = new Set<BrowserWindow>();

function createWindow() {
  const window = new BrowserWindow({
    show: !(testDirectory && !app.isPackaged),
    width: 1400,
    height: 960,
    minWidth: 860,
    minHeight: 640,
    title: '小镇事务所',
    backgroundColor: '#f5f6f8',
    webPreferences: {
      preload: path.join(root, 'dist-electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#ffffff', symbolColor: '#39465b', height: 36 },
  });
  windows.add(window);
  window.on('closed', () => windows.delete(window));
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== window.webContents.getURL().split('#')[0])
      event.preventDefault();
  });
  if (developmentUrl) window.loadURL(developmentUrl);
  else window.loadFile(path.join(root, 'dist/index.html'));
}

app.whenReady().then(() => {
  const store = createSaveStore(path.join(app.getPath('userData'), 'saves'));
  ipcMain.handle('game:load', () => store.load());
  ipcMain.handle('game:save', (_event, raw: unknown) => {
    if (typeof raw !== 'string') throw new Error('存档须为文本数据。');
    return store.save(raw);
  });
  ipcMain.handle('game:backup', () => store.backup());
  ipcMain.handle('game:location', () => store.location);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
