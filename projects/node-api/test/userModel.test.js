const test = require('node:test');
const assert = require('node:assert/strict');
const userModel = require('../src/model/userModel');
const database = require('../src/database');

async function resetUsersTable() {
  await database.run('DELETE FROM users');
  await database.run('DELETE FROM sqlite_sequence WHERE name = ?', ['users']);
}

test('database should initialize the users table', async () => {
  await database.initialize();
  const tables = await database.all("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'");

  assert.equal(tables.length, 1);
  assert.equal(tables[0].name, 'users');
});

test('create, update and delete should persist data in SQLite', async () => {
  await resetUsersTable();

  const created = await userModel.create({ name: 'Jane Doe', email: 'jane@example.com' });
  const updated = await userModel.update(String(created.id), { name: 'Jane Updated', email: 'jane.updated@example.com' });
  const allUsers = await userModel.findAll();
  const removed = await userModel.deleteUser(String(updated.id));

  assert.equal(created.name, 'Jane Doe');
  assert.equal(updated.name, 'Jane Updated');
  assert.ok(allUsers.some(user => user.email === 'jane.updated@example.com'));
  assert.equal(removed.email, 'jane.updated@example.com');
});

test('findById should accept route param strings and match the stored user', async () => {
  await resetUsersTable();

  const created = await userModel.create({ id: 1, name: 'John Doe', email: 'john.doe@example.com' });
  const user = await userModel.findById(String(created.id));

  assert.deepEqual(user, { id: created.id, name: 'John Doe', email: 'john.doe@example.com' });
});
