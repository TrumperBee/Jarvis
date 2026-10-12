const { app, BrowserWindow, ipcMain, powerMonitor, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = !app.isPackaged;

// ── Hardware Acceleration ─────────────────────────────────────────────
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-frame-rate-limit');

let mainWindow;
let webServerProcess = null;
let tray = null;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    fullscreen: true,
    kiosk: false,
    backgroundColor: '#000000',
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    }
  });

  // Set Content-Security-Policy for all responses
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://threejs.org https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https://*.githubusercontent.com https://upload.wikimedia.org https://threejs.org https://raw.githubusercontent.com",
      "connect-src 'self' ws://localhost:8080 ws://localhost:5173 http://localhost:5173 http://localhost:8080",
      "media-src 'self'",
      "child-src 'self' blob:"
    ].join('; ');
    callback({ responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [csp]
    }});
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'src/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    cleanup();
  });
};

const cleanup = () => {
  if (webServerProcess) {
    webServerProcess.kill();
    webServerProcess = null;
  }
};

app.whenReady().then(() => {
  createWindow();
  startWebServer();
  setupTray();

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

ipcMain.on('ping', () => {
  mainWindow.webContents.send('pong');
});

ipcMain.on('show-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

const startWebServer = () => {
  try {
    console.log('Starting AEGIS OS local web server...');
    const serverDir = path.join(__dirname);
    webServerProcess = spawn('uv', ['run', 'python', 'server.py'], {
      cwd: serverDir,
      detached: true,
      stdio: 'ignore'
    });
    webServerProcess.unref();
    console.log('Web server started successfully');
  } catch (error) {
    console.error('Failed to start web server:', error);
  }
};

const setupTray = () => {
  const iconPath = isDev ?
    path.join(__dirname, 'src', 'assets', 'icon.png') :
    path.join(process.resourcesDir, 'src', 'assets', 'icon.png');

  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show AEGIS OS',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Hide AEGIS OS',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit AEGIS OS',
      click: () => { app.quit(); }
    }
  ]);

  tray.setToolTip('AEGIS OS - Advanced Engineering & General Intelligence System');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
};

powerMonitor.on('on-ac', () => {
  console.log('Connected to AC power');
});

powerMonitor.on('on-battery', () => {
  console.log('Running on battery power');
});
