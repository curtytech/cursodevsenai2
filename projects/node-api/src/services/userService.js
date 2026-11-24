const userModel = require('../model/userModel');

async function getAllUsers() {
  return userModel.findAll();
}

async function getUserById(id) {
  return userModel.findById(id);
}

async function createUser(userData) {
  return userModel.create(userData);
}

async function updateUser(id, userData) {
  return userModel.update(id, userData);
}

async function deleteUser(id) {
  return userModel.deleteUser(id);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};