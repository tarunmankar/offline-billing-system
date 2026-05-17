const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  // Authentication
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  // Database: Products
  getProducts: () => ipcRenderer.invoke('get-products'),
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  getProductByBarcode: (barcode) => ipcRenderer.invoke('get-product-by-barcode', barcode),
  updateProduct: (id, product) => ipcRenderer.invoke('update-product', { id, product }),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  // Sales
  saveSale: (payload) => ipcRenderer.invoke('save-sale', payload),
  // Printing
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printReceipt: (payload) => ipcRenderer.invoke('print-receipt', payload),
  // Database Operations
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  resetDatabase: () => ipcRenderer.invoke('db:reset'),
  restoreDatabase: (backupData) => ipcRenderer.invoke('db:restore', backupData),
  // Expenses
  getExpenses: () => ipcRenderer.invoke('get-expenses'),
  addExpense: (expense) => ipcRenderer.invoke('add-expense', expense),
  deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),
  // Sharing
  shareWhatsApp: (phone, text) => ipcRenderer.invoke('share:whatsapp', { phone, text }),
  savePDF: (htmlContent, invoiceNo) => ipcRenderer.invoke('save:pdf', { htmlContent, invoiceNo }),
});
