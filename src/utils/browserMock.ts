if (!(window as any).electronAPI) {
  console.warn('⚠️ Running in Browser Mode. Injecting global database & IPC mocks for full sandboxed testing!');

  // Helper to load/save products from localStorage
  const getMockProducts = () => {
    const stored = localStorage.getItem('mock_products');
    if (!stored) {
      // Seed initial products (including the requested '123' barcode)
      const initial = [
        { id: 1, name: 'Paracetamol 500mg', price: 45.0, stock: 150, barcode: '123', metadata: '{}' },
        { id: 2, name: 'Amoxicillin Syrup', price: 120.0, stock: 45, barcode: '456', metadata: '{}' },
        { id: 3, name: 'Vitamin C Chewables', price: 80.0, stock: 200, barcode: '789', metadata: '{}' }
      ];
      localStorage.setItem('mock_products', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  };

  const saveMockProducts = (products: any[]) => {
    localStorage.setItem('mock_products', JSON.stringify(products));
  };

  (window as any).electronAPI = {
    getConfig: async () => {
      const stored = localStorage.getItem('mock_config');
      if (stored) return JSON.parse(stored);
      return {
        shop_info: { name: 'Billing Pro 2026', type: 'PHARMACY', tax_label: 'GST' },
        features: { barcode_scanner: true, inventory_management: true, user_auth: true },
        billing_settings: { print_format: 'A4', default_tax_percent: 18 },
        theme: { primary_color: '#3b82f6', dark_mode: true }
      };
    },
    updateConfig: async (config: any) => {
      localStorage.setItem('mock_config', JSON.stringify(config));
      return true;
    },
    login: async ({ username, password }: any) => {
      if (username === 'admin' && password === 'admin123') {
        return { success: true, user: { id: 1, username: 'admin', role: 'Admin' } };
      }
      return { success: false, error: 'Invalid credentials. Use admin / admin123.' };
    },
    getProducts: async () => {
      return getMockProducts();
    },
    addProduct: async (product: any) => {
      const products = getMockProducts();
      const newProduct = {
        id: products.length > 0 ? Math.max(...products.map((p: any) => p.id)) + 1 : 1,
        name: product.name,
        price: Number(product.price),
        stock: Number(product.stock),
        barcode: product.barcode,
        metadata: JSON.stringify(product.metadata || {})
      };
      products.push(newProduct);
      saveMockProducts(products);
      return newProduct.id;
    },
    getProductByBarcode: async (barcode: string) => {
      const products = getMockProducts();
      return products.find((p: any) => p.barcode === barcode) || null;
    },
    updateProduct: async (id: number, updated: any) => {
      let products = getMockProducts();
      products = products.map((p: any) => p.id === id ? {
        ...p,
        name: updated.name,
        price: Number(updated.price),
        stock: Number(updated.stock),
        barcode: updated.barcode,
        metadata: JSON.stringify(updated.metadata || {})
      } : p);
      saveMockProducts(products);
      return true;
    },
    deleteProduct: async (id: number) => {
      let products = getMockProducts();
      products = products.filter((p: any) => p.id !== id);
      saveMockProducts(products);
      return true;
    },
    saveSale: async (payload: any) => {
      console.log('%c[Mock Sale Saved]', 'color: green; font-weight: bold;', payload);
      // Decrement mock stock
      let products = getMockProducts();
      for (const item of payload.items) {
        products = products.map((p: any) => {
          if (p.id === item.productId) {
            return { ...p, stock: Math.max(0, p.stock - item.quantity) };
          }
          return p;
        });
      }
      saveMockProducts(products);
      return Math.floor(Math.random() * 10000);
    },
    getPrinters: async () => {
      return [
        { name: 'Microsoft Print to PDF', isDefault: true },
        { name: 'POS-80 Thermal Printer', isDefault: false }
      ];
    },
    printReceipt: async ({ htmlContent, format }: any) => {
      console.log(`%c[Mock Print - ${format.toUpperCase()}]`, 'color: blue; font-weight: bold;');
      
      // Beautiful mock print preview popup window
      const printWindow = window.open('', '_blank', 'width=450,height=650');
      if (printWindow) {
        const baseStyles = format === 'thermal' 
          ? `
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 20px; 
              width: 300px;
              color: black;
              background: white;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed black; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 2px 0; }
            .right { text-align: right; }
          `
          : `
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              font-size: 14px;
              margin: 0;
              padding: 30px;
              color: #333;
              background: white;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f8f9fa; }
            .right { text-align: right; }
            .total-row { font-weight: bold; font-size: 15px; }
          `;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Print Receipt Preview</title>
              <style>
                ${baseStyles}
                .preview-banner {
                  background: #f59e0b;
                  color: white;
                  padding: 8px;
                  text-align: center;
                  font-weight: bold;
                  font-size: 12px;
                  margin-bottom: 15px;
                  font-family: sans-serif;
                  border-radius: 4px;
                }
              </style>
            </head>
            <body>
              <div class="preview-banner">🖨️ MOCK BROWSER PRINT PREVIEW</div>
              ${htmlContent}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      return true;
    }
  };
}
