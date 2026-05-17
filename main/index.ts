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
    mainWindow.webContents.openDevTools(); // Automatically opens DevTools for easy debugging in dev mode
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

  // Initialize Print Manager IPC Handlers
  const { PrintManager } = require('./managers/PrintManager');
  PrintManager.init();

  // Initialize Backup Manager IPC Handlers
  const { BackupManager } = require('./managers/BackupManager');
  BackupManager.init();

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

ipcMain.handle('update-product', (_, { id, product }) => {
  if (!db) throw new Error('Database not initialized');
  const { name, price, stock, barcode, metadata } = product;
  db.prepare(
    'UPDATE products SET name = ?, price = ?, stock = ?, barcode = ?, metadata = ? WHERE id = ?'
  ).run(name, price, stock, barcode, JSON.stringify(metadata), id);
  return true;
});

ipcMain.handle('delete-product', (_, id) => {
  if (!db) throw new Error('Database not initialized');
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return true;
});

ipcMain.handle('save-sale', (_, payload) => {
  if (!db) throw new Error('Database not initialized');
  const { userId, totalAmount, taxTotal, taxDetails, items } = payload;
  
  const insertSale = db.prepare(
    'INSERT INTO sales (user_id, total_amount, tax_total, tax_details) VALUES (?, ?, ?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO sale_items (sale_id, product_id, quantity, rate, tax_percent) VALUES (?, ?, ?, ?, ?)'
  );
  const updateProductStock = db.prepare(
    'UPDATE products SET stock = stock - ? WHERE id = ?'
  );

  const transaction = db.transaction(() => {
    const saleResult = insertSale.run(userId, totalAmount, taxTotal, JSON.stringify(taxDetails));
    const saleId = saleResult.lastInsertRowid;
    for (const item of items) {
      insertItem.run(saleId, item.productId, item.quantity, item.rate, item.taxPercent);
      updateProductStock.run(item.quantity, item.productId);
    }
    return saleId;
  });

  return transaction();
});

// --- EXPENSES DB HANDLERS ---
ipcMain.handle('get-expenses', () => {
  if (!db) return [];
  return db.prepare(`
    SELECT e.*, u.username as user 
    FROM expenses e 
    JOIN users u ON e.user_id = u.id 
    ORDER BY e.timestamp DESC
  `).all();
});

ipcMain.handle('add-expense', (_, { userId, amount, description }) => {
  if (!db) throw new Error('Database not initialized');
  const result = db.prepare(
    'INSERT INTO expenses (user_id, amount, description) VALUES (?, ?, ?)'
  ).run(userId, amount, description);
  return result.lastInsertRowid;
});

ipcMain.handle('delete-expense', (_, id) => {
  if (!db) throw new Error('Database not initialized');
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return true;
});

ipcMain.handle('share:whatsapp', (_, { phone, text }) => {
  const { shell } = require('electron');
  const formattedPhone = phone.replace(/\D/g, ''); // strip non-digits
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  shell.openExternal(url);
  return true;
});

ipcMain.handle('save:pdf', async (_, { htmlContent, invoiceNo }) => {
  const { dialog, BrowserWindow } = require('electron');
  const fs = require('fs');

  const win = BrowserWindow.getFocusedWindow();
  if (!win) return false;

  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Invoice PDF',
    defaultPath: `invoice_${invoiceNo}.pdf`,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (!filePath) return false;

  // Render the HTML to a hidden window and print to PDF
  let printWindow: BrowserWindow | null = new BrowserWindow({ show: false });
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 40px;
            color: #333;
            background: white;
          }
          @page { size: A4 portrait; margin: 10mm; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; }
          .right { text-align: right; }
          .total-row { font-weight: bold; font-size: 16px; }
        </style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `;

  printWindow!.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  return new Promise((resolve) => {
    printWindow!.webContents.on('did-finish-load', async () => {
      try {
        const data = await printWindow!.webContents.printToPDF({
          printBackground: true,
          margins: { marginType: 'none' }
        });
        fs.writeFileSync(filePath, data);
        printWindow?.close();
        printWindow = null;
        resolve(true);
      } catch (err) {
        console.error('Failed to save PDF:', err);
        printWindow?.close();
        printWindow = null;
        resolve(false);
      }
    });
  });
});
