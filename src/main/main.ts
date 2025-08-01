import path from 'node:path';
import {
  OVERLAY_COLOR,
  OVERLAY_HEIGHT,
  OVERLAY_SYMBOL_COLOR,
} from '@common/constants/base_window';
import { BrowserWindow, app } from 'electron';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.APP_ROOT = path.join(__dirname, '..');

export const RSBUILD_DEV_SERVER_URL = process.env.RSBUILD_DEV_SERVER_URL;
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

let win: BrowserWindow;

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.js'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: OVERLAY_COLOR,
      symbolColor: OVERLAY_SYMBOL_COLOR,
      height: 29, // the smallest size of the title bar on windows accounting for the border on windows 11
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (RSBUILD_DEV_SERVER_URL) {
    win.loadURL(RSBUILD_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
