const taskModel = require('../model/taskModel');

async function getAlltasks() {
  return taskModel.findAll();
}

async function gettaskById(id) {
  return taskModel.findById(id);
}

async function createtask(taskData) {
  return taskModel.create(taskData);
}

async function updatetask(id, taskData) {
  return taskModel.update(id, taskData);
}

async function deleteTask(id) {
  return taskModel.deleteTask(id);
}

module.exports = {
  getAlltasks,
  gettaskById,
  createtask,
  updatetask,
  deleteTask
};