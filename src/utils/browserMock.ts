if (!(window as any).electronAPI) {
  console.warn('⚠️ Running in Browser Mode. Injecting global database & IPC mocks for full sandboxed testing!');

  // Helper to load/save products from localStorage
      const getMockProducts = () => {
        const stored = localStorage.getItem('mock_products');
        if (!stored) {
          // Seed initial products (with low stock & near expiry fields for rich testing)
          const today = new Date();
          const nearExpiryDate = new Date();
          nearExpiryDate.setDate(today.getDate() + 10); // 10 days from now (near expiry)
          
          const expiredDate = new Date();
          expiredDate.setDate(today.getDate() - 15); // 15 days ago (expired)

          const initial: any[] = [];
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
      let totalQty = 0;
      for (const item of payload.items) {
        totalQty += item.quantity;
        products = products.map((p: any) => {
          if (p.id === item.productId) {
            return { ...p, stock: Math.max(0, p.stock - item.quantity) };
          }
          return p;
        });
      }
      saveMockProducts(products);
      
      // Save sale to mock ledger
      const sales = JSON.parse(localStorage.getItem('mock_sales') || '[]');
      const newSale = {
        id: sales.length > 0 ? Math.max(...sales.map((s: any) => s.id)) + 1 : 1,
        date: new Date().toISOString(),
        total_amount: payload.totalAmount,
        items_count: totalQty,
        user: payload.userId === 1 ? 'admin' : 'cashier',
        tax_total: payload.taxTotal
      };
      sales.push(newSale);
      localStorage.setItem('mock_sales', JSON.stringify(sales));
      
      return newSale.id;
    },
    getSales: async () => {
      return JSON.parse(localStorage.getItem('mock_sales') || '[]');
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
    },
    backupDatabase: async () => {
      console.log('%c[Mock Backup Activated]', 'color: darkgreen; font-weight: bold;');
      return new Promise(resolve => setTimeout(() => {
        const fakePath = 'C:\\Users\\MockUser\\AppData\\Roaming\\offline-billing\\backups\\billing_backup_2026-05-17.db';
        resolve(fakePath);
      }, 1000));
    },
    resetDatabase: async () => {
      console.log('%c[Mock Factory Reset Activated]', 'color: red; font-weight: bold;');
      return new Promise(resolve => setTimeout(() => {
        localStorage.clear();
        alert('Browser database fully wiped! App restarting now...');
        window.location.reload();
        resolve(true);
      }, 1500));
    }
  };
}
