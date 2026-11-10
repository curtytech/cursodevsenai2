const users = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com' }
]

function findAll() {
    return users;
}

function findById(id) {
    return users.find(user => user.id === id);
}

function create(userData) {
    const newUser = { ...userData, id: Date.now() };
    users.push(newUser);
    return newUser;
}

function update(id, userData) {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    users[userIndex] = { ...users[userIndex], ...userData };
    return users[userIndex];
}

function deleteUser(id) {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    return users.splice(userIndex, 1)[0];
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    deleteUser
};
