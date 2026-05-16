const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'main/db/test.db');
console.log('Testing Database at:', dbPath);

try {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  
  const db = new Database(dbPath);
  db.prepare('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, val TEXT)').run();
  db.prepare('INSERT INTO test (val) VALUES (?)').run('Test success');
  const result = db.prepare('SELECT * FROM test').get();
  console.log('Result from DB:', result);
  console.log('--- TEST PASSED ---');
} catch (err) {
  console.error('--- TEST FAILED ---');
  console.error(err);
}
