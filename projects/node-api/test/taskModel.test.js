const test = require('node:test');
const assert = require('node:assert/strict');
const taskModel = require('../src/model/taskModel');
const database = require('../src/database');

async function resetTasksTable() {
  await database.run('DELETE FROM tasks');
  await database.run('DELETE FROM sqlite_sequence WHERE name = ?', ['tasks']);
}

test('database should initialize the tasks table', async () => {
  await database.initialize();
  const tables = await database.all("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tasks'");

  assert.equal(tables.length, 1);
  assert.equal(tables[0].name, 'tasks');
});

test('create, update and delete should persist tasks in SQLite with boolean is_completed', async () => {
  await resetTasksTable();

  const created = await taskModel.create({ title: 'Estudar SQLite' });
  assert.equal(created.title, 'Estudar SQLite');
  assert.equal(created.is_completed, false);

  const updated = await taskModel.update(String(created.id), {
    title: 'Estudar SQLite e Express',
    is_completed: true
  });
  assert.equal(updated.title, 'Estudar SQLite e Express');
  assert.equal(updated.is_completed, true);

  const allTasks = await taskModel.findAll();
  assert.equal(allTasks.length, 1);
  assert.equal(allTasks[0].is_completed, true);

  const removed = await taskModel.deleteTask(String(updated.id));
  assert.equal(removed.id, created.id);
});

test('create and update should throw 400 error when title is empty', async () => {
  await resetTasksTable();

  await assert.rejects(
    () => taskModel.create({ title: '   ' }),
    (error) => error.statusCode === 400
  );

  const created = await taskModel.create({ title: 'Tarefa válida' });
  await assert.rejects(
    () => taskModel.update(String(created.id), { title: '   ' }),
    (error) => error.statusCode === 400
  );
});
