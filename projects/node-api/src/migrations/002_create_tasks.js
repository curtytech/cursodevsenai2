module.exports = {
  name: '002_create_tasks',
  sql: `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      is_completed BOOLEAN DEFAULT FALSE
    )
  `
};

