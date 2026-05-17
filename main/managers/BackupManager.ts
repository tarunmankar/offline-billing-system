import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

export class BackupManager {
  private static getPaths() {
    const dbPath = app.isPackaged 
      ? path.join(app.getPath('userData'), 'billing.db')
      : path.join(process.cwd(), 'main/db/dev.db');

    const backupsDir = app.isPackaged
      ? path.join(app.getPath('userData'), 'backups')
      : path.join(process.cwd(), 'backups');

    return { dbPath, backupsDir };
  }

  static init() {
    const { backupsDir } = this.getPaths();
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Manual backup IPC
    ipcMain.handle('db:backup', async () => {
      return this.createBackup();
    });

    // Factory reset IPC
    ipcMain.handle('db:reset', async () => {
      return this.factoryReset();
    });

    // Restore database IPC
    ipcMain.handle('db:restore', async (event, backupData) => {
      return this.restoreBackup(backupData);
    });

    // Run the scheduler check on bootup
    this.scheduleAutoBackup();
  }

  private static createBackup(): Promise<string> {
    return new Promise((resolve, reject) => {
      const { dbPath, backupsDir } = this.getPaths();

      if (!fs.existsSync(dbPath)) {
        return reject(new Error('Database file does not exist.'));
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupsDir, `billing_backup_${timestamp}.db`);

      try {
        // dynamic require better-sqlite3 instance
        const db = require('../db/database').default;
        db.backup(backupPath)
          .then(() => {
            console.log('DB Backup successfully created at:', backupPath);
            resolve(backupPath);
          })
          .catch((err: any) => {
            console.error('SQLite native backup failed, falling back to copy:', err);
            // Fallback to copy file
            fs.copyFile(dbPath, backupPath, (copyErr) => {
              if (copyErr) return reject(copyErr);
              resolve(backupPath);
            });
          });
      } catch (err) {
        fs.copyFile(dbPath, backupPath, (copyErr) => {
          if (copyErr) return reject(copyErr);
          resolve(backupPath);
        });
      }
    });
  }

  private static factoryReset(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const { dbPath } = this.getPaths();
      try {
        console.log('Initiating Factory Reset...');
        
        // Dynamic import DB and close it
        const db = require('../db/database').default;
        db.close();

        // Remove active database file
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
        }

        // Wipe WAL / SHM files if SQLite is running in WAL journal mode
        const walPath = `${dbPath}-wal`;
        const shmPath = `${dbPath}-shm`;
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

        // Wipe configuration file too
        const configPath = app.isPackaged
          ? path.join(app.getPath('userData'), 'config.json')
          : path.join(process.cwd(), 'config.json');

        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
        }

        console.log('Wiped DB and dynamic configurations. Relaunching...');

        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 1500);

        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  private static restoreBackup(backupData: any): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Restoring Database from backup payload...');
        const db = require('../db/database').default;
        
        // Use a SQLite transaction to ensure absolute transactional integrity
        const transaction = db.transaction(() => {
          // 1. Wipe current products
          db.prepare('DELETE FROM products').run();
          
          // 2. Insert backup products
          if (backupData.products && Array.isArray(backupData.products)) {
            const insertProduct = db.prepare(`
              INSERT INTO products (id, barcode, name, price, stock, metadata)
              VALUES (?, ?, ?, ?, ?, ?)
            `);
            for (const p of backupData.products) {
              insertProduct.run(
                p.id || null,
                p.barcode || null,
                p.name,
                p.price,
                p.stock,
                typeof p.metadata === 'string' ? p.metadata : JSON.stringify(p.metadata || {})
              );
            }
          }
          
          // 3. Wipe and restore sales if present
          if (backupData.sales && Array.isArray(backupData.sales)) {
            db.prepare('DELETE FROM sale_items').run();
            db.prepare('DELETE FROM sales').run();
            
            const insertSale = db.prepare(`
              INSERT INTO sales (id, user_id, total_amount, tax_total, tax_details, timestamp)
              VALUES (?, ?, ?, ?, ?, ?)
            `);
            for (const s of backupData.sales) {
              insertSale.run(
                s.id,
                s.user_id || 1,
                s.total_amount,
                s.tax_total || 0,
                typeof s.tax_details === 'string' ? s.tax_details : JSON.stringify(s.tax_details || {}),
                s.timestamp || new Date().toISOString()
              );
            }
            
            if (backupData.sale_items && Array.isArray(backupData.sale_items)) {
              const insertSaleItem = db.prepare(`
                INSERT INTO sale_items (id, sale_id, product_id, quantity, rate, tax_percent)
                VALUES (?, ?, ?, ?, ?, ?)
              `);
              for (const item of backupData.sale_items) {
                insertSaleItem.run(
                  item.id || null,
                  item.sale_id,
                  item.product_id,
                  item.quantity,
                  item.rate,
                  item.tax_percent || 0
                );
              }
            }
          }
        });
        
        transaction();
        
        // 4. Wipe and restore config if present
        if (backupData.config) {
          const configPath = app.isPackaged
            ? path.join(app.getPath('userData'), 'config.json')
            : path.join(process.cwd(), 'config.json');
          
          fs.writeFileSync(configPath, JSON.stringify(backupData.config, null, 2));
          console.log('Restored configurations to:', configPath);
        }
        
        console.log('Database restore completed successfully!');
        resolve(true);
      } catch (err) {
        console.error('Failed to restore database backup:', err);
        reject(err);
      }
    });
  }

  private static scheduleAutoBackup() {
    const { backupsDir } = this.getPaths();

    const checkAndBackup = async () => {
      try {
        if (!fs.existsSync(backupsDir)) {
          fs.mkdirSync(backupsDir, { recursive: true });
        }

        const files = fs.readdirSync(backupsDir);
        const backupFiles = files.filter(f => f.startsWith('billing_backup_'));

        let lastBackupTime = 0;
        backupFiles.forEach(f => {
          const stats = fs.statSync(path.join(backupsDir, f));
          if (stats.mtimeMs > lastBackupTime) {
            lastBackupTime = stats.mtimeMs;
          }
        });

        const twentyFourHours = 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (now - lastBackupTime > twentyFourHours) {
          console.log('Auto Backup: Initiating scheduled SQLite state backup...');
          await this.createBackup();
        } else {
          console.log('Auto Backup: Database recently backed up. Next check in 1 hour.');
        }
      } catch (err) {
        console.error('Scheduled backup check failed:', err);
      }
    };

    // Run 5 seconds after bootup, then check every hour
    setTimeout(checkAndBackup, 5000);
    setInterval(checkAndBackup, 60 * 60 * 1000);
  }
}
