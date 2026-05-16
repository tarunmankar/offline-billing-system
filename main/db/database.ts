import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// Database path logic: dev folder vs production AppData
const dbPath = app.isPackaged 
  ? path.join(app.getPath('userData'), 'billing.db')
  : path.join(process.cwd(), 'main/db/dev.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // Performance optimization

export const initDB = () => {
  console.log('Initializing Database at:', dbPath);

  // 1. Users Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'cashier'
    )
  `).run();

  // 2. Products Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      barcode TEXT UNIQUE,
      metadata TEXT -- JSON string for custom fields (Batch, Expiry, etc.)
    )
  `).run();

  // 3. Sales Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_amount REAL NOT NULL,
      tax_total REAL NOT NULL,
      tax_details TEXT, -- JSON string for tax breakdown
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  // 4. Sale Items Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      rate REAL NOT NULL,
      tax_percent REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `).run();

  // Seed default admin if table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    console.log('Seeding default admin user...');
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run('admin', 'admin123', 'admin');
  }
};

export default db;
