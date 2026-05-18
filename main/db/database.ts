import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import crypto from 'crypto';

// Database storage resolution path: dev folder vs packaged app path
const dbPath = app.isPackaged 
  ? path.join(app.getPath('userData'), 'billing.db')
  : path.join(process.cwd(), 'main/db/dev.db');

const db = new Database(dbPath);

// --- SECURE CRYTOGRAPHIC HASHING ENGINE (NODE NATIVE) ---
/**
 * Hashes a plaintext password using PBKDF2 (SHA-512) with a unique salt
 */
export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verifies a password against a stored PBKDF2 salt:hash payload
 */
export const verifyPassword = (password: string, storedHash: string): boolean => {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
};

// --- DATABASE MIGRATIONS ENGINE ---
export const initDB = () => {
  console.log('DB: Connecting & Initializing SQLite Database at:', dbPath);

  // 1. Connection-level Pragmas (Enforce Integrity & Speed)
  db.pragma('foreign_keys = ON');       // Enforce relational model integrity
  db.pragma('journal_mode = WAL');       // Write-Ahead Logging for speed
  db.pragma('synchronous = NORMAL');     // Balance write speed with crash safety

  // 2. Users Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('Admin', 'Cashier')) NOT NULL
    )
  `).run();

  // 3. Products Table (Dynamic Custom Metadata support)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      price REAL NOT NULL CHECK(price >= 0.0),
      stock INTEGER NOT NULL DEFAULT 0,
      metadata TEXT DEFAULT '{}'
    )
  `).run();

  // 4. Sales Table (Transactional Summaries)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL CHECK(total_amount >= 0.0),
      tax_total REAL NOT NULL DEFAULT 0.0 CHECK(tax_total >= 0.0),
      tax_details TEXT DEFAULT '{}',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  // 5. Sale Items Table (Invoice Line items)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      rate REAL NOT NULL CHECK(rate >= 0.0),
      tax_percent REAL NOT NULL DEFAULT 0.0 CHECK(tax_percent >= 0.0),
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `).run();

  // 6. Customers Table (B2B/Credit Clients)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      balance REAL DEFAULT 0.0
    )
  `).run();

  // 7. Credit Ledger Table (B2B Credit book log)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS credit_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      sale_id INTEGER,
      amount REAL NOT NULL,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
    )
  `).run();

  // 7.5. Expenses Table (Daily shop outflows)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0.0),
      description TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  // 8. Performance Indexes
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_credit_ledger_customer ON credit_ledger(customer_id)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_expenses_timestamp ON expenses(timestamp)`).run();

  console.log('DB: Tables and performance indexes successfully verified.');

  // 9. Seeding Core Admin User Record Safely
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    console.log('DB: No user accounts found. Bootstrapping Super-Administrator account...');
    const hashed = hashPassword('admin123');
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run('admin', hashed, 'Admin');
    console.log('DB: Default administrator securely provisioned (Username: admin, Password: admin123).');
  }
};

export default db;
