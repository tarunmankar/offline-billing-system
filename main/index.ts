import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let db: any = null;

// Use try-catch for the native module to prevent app crash
try {
  const database = require('./db/database');
  db = database.default;
  const { initDB } = database;
  
  app.whenReady().then(() => {
    try {
      initDB();
      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Failed to initialize database:', err);
    }
  });
} catch (err) {
  console.error('CRITICAL: Failed to load better-sqlite3 native module.', err);
  console.error('This is likely due to the space in your folder path: "My Apps"');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Config
ipcMain.handle('get-config', () => {
  const { ConfigManager } = require('./managers/ConfigManager');
  const manager = new ConfigManager();
  return manager.getConfig();
});

ipcMain.handle('update-config', (_, config) => {
  const { ConfigManager } = require('./managers/ConfigManager');
  const manager = new ConfigManager();
  return manager.saveConfig(config);
});

// --- AUTHENTICATION HANDLERS ---
ipcMain.handle('auth:login', (_, { username, password }) => {
  const { AuthManager } = require('./managers/AuthManager');
  return AuthManager.login(username, password);
});

// --- DB HANDLERS ---
ipcMain.handle('get-products', () => {
  if (!db) return [];
  return db.prepare('SELECT * FROM products').all();
});

ipcMain.handle('add-product', (_, product) => {
  if (!db) throw new Error('Database not initialized');
  const { name, price, stock, barcode, metadata } = product;
  const result = db.prepare(
    'INSERT INTO products (name, price, stock, barcode, metadata) VALUES (?, ?, ?, ?, ?)'
  ).run(name, price, stock, barcode, JSON.stringify(metadata));
  return result.lastInsertRowid;
});

ipcMain.handle('get-product-by-barcode', (_, barcode) => {
  if (!db) return null;
  return db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode);
});
