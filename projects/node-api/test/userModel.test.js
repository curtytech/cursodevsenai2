const test = require('node:test');
const assert = require('node:assert/strict');
const userModel = require('../src/model/userModel');

test('findById should accept route param strings and match the numeric id', () => {
  const user = userModel.findById('1');
  assert.deepEqual(user, { id: 1, name: 'John Doe', email: 'john.doe@example.com' });
});

test('update and delete should also work with string ids from the route', () => {
  const created = userModel.create({ name: 'Jane Doe', email: 'jane@example.com' });
  const updated = userModel.update(String(created.id), { name: 'Jane Updated' });
  const removed = userModel.deleteUser(String(updated.id));

  assert.equal(updated.name, 'Jane Updated');
  assert.equal(removed.name, 'Jane Updated');
});
