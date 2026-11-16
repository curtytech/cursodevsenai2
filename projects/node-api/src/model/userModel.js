const database = require('../database');

async function findAll() {
    await database.ensureInitialized();
    return database.all('SELECT id, name, email FROM users ORDER BY id');
}

async function findById(id) {
    await database.ensureInitialized();
    const numericId = Number(id);
    return database.get('SELECT id, name, email FROM users WHERE id = ?', [numericId]);
}

async function create(userData) {
    await database.ensureInitialized();

    const name = userData.name?.trim();
    const email = userData.email?.trim();

    if (!name || !email) {
        throw new Error('Nome e email são obrigatórios');
    }

    const result = await database.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    return findById(result.lastID);
}

async function update(id, userData) {
    await database.ensureInitialized();

    const numericId = Number(id);
    const currentUser = await findById(numericId);
    if (!currentUser) {
        return null;
    }

    const nextUser = {
        name: userData.name?.trim() || currentUser.name,
        email: userData.email?.trim() || currentUser.email
    };

    await database.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [nextUser.name, nextUser.email, numericId]);
    return findById(numericId);
}

async function deleteUser(id) {
    await database.ensureInitialized();

    const numericId = Number(id);
    const user = await findById(numericId);
    if (!user) {
        return null;
    }

    await database.run('DELETE FROM users WHERE id = ?', [numericId]);
    return user;
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    deleteUser
};
