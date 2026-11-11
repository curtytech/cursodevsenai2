const users = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com' }
]

function findAll() {
    return users;
}

function findById(id) {
    const numericId = Number(id);
    console.log('ID do usuário model:', numericId);
    return users.find(user => user.id === numericId);
}

function create(userData) {
    const newUser = { ...userData, id: users.length + 1 };
    users.push(newUser);
    return newUser;
}

function update(id, userData) {
    const numericId = Number(id);
    const userIndex = users.findIndex(user => user.id === numericId);
    if (userIndex === -1) return null;
    users[userIndex] = { ...users[userIndex], ...userData };
    return users[userIndex];
}

function deleteUser(id) {
    const numericId = Number(id);
    const userIndex = users.findIndex(user => user.id === numericId);
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
