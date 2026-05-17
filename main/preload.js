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
});
