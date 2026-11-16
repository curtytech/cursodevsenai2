const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDirectory = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDirectory, 'users.db');

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });
}

async function initialize() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )
  `);

  return db;
}

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initialize();
    initialized = true;
  }
}

initialize().then(() => {
  initialized = true;
}).catch((error) => {
  console.error('Erro ao inicializar o banco SQLite:', error);
});

module.exports = {
  db,
  run,
  get,
  all,
  initialize,
  ensureInitialized,
  close: () => new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  })
};
