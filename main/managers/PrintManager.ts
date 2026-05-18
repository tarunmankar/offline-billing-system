import { BrowserWindow, ipcMain } from 'electron';

export class PrintManager {
  static init() {
    ipcMain.handle('get-printers', async () => {
      try {
        const win = new BrowserWindow({ show: false });
        const printers = await win.webContents.getPrintersAsync();
        win.close();
        return printers;
      } catch (err) {
        console.error('Failed to get printers:', err);
        return [];
      }
    });

    ipcMain.handle('print-receipt', async (_, { htmlContent, format, printerName }) => {
      return new Promise((resolve, reject) => {
        let printWindow: BrowserWindow | null = new BrowserWindow({
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });

        // Base styles depending on format (thermal vs A4)
        const baseStyles = format === 'thermal' 
          ? `
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 10px; 
              width: 280px; /* Standard 80mm roll width approx */
              color: black;
              background: white;
            }
            @page { margin: 0; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed black; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 2px 0; }
            .right { text-align: right; }
          `
          : `
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
          `;

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>${baseStyles}</style>
            </head>
            <body>${htmlContent}</body>
          </html>
        `;

        printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

        printWindow.webContents.on('did-finish-load', () => {
          printWindow!.webContents.print({
            silent: true,
            printBackground: true,
            deviceName: printerName || undefined, // Uses default printer if undefined
            margins: { marginType: 'none' }
          }, (success, failureReason) => {
            printWindow?.close();
            printWindow = null;
            if (success) {
              resolve(true);
            } else {
              reject(new Error(failureReason || 'Print failed'));
            }
          });
        });
      });
    });
  }
}
