const createUsersMigration = require('./001_create_users');
const createTasksMigration = require('./002_create_tasks');

module.exports = [
  createUsersMigration,
  createTasksMigration
];
