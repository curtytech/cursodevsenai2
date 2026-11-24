const database = require('../database');

async function findAll() {
    await database.ensureInitialized();
    return database.all('SELECT id, title, is_completed FROM tasks ORDER BY id');
}

async function findById(id) {
    await database.ensureInitialized();
    const numericId = Number(id);
    return database.get('SELECT id, title, is_completed FROM tasks WHERE id = ?', [numericId]);
}


async function create(userData) {
    await database.ensureInitialized();

    const title = userData.title?.trim();
    const is_completed = userData.is_completed ?? false;

    if (!title) {
        throw new Error('Título é obrigatório');
    }

    const result = await database.run('INSERT INTO tasks (title, is_completed) VALUES (?, ?)', [title, is_completed]);
    return findById(result.lastID);
}


async function update(id, userData) {
    await database.ensureInitialized();

    const numericId = Number(id);
    const currentUser = await findById(numericId);
    if (!currentUser) {
        return null;
    }

    const nextTask = {
        title: userData.title?.trim() || currentUser.title,
        is_completed: userData.is_completed ?? currentUser.is_completed
    };

    await database.run('UPDATE tasks SET title = ?, is_completed = ? WHERE id = ?', [nextTask.title, nextTask.is_completed, numericId]);
    return findById(numericId);
}

async function deleteTask(id) {
    await database.ensureInitialized();

    const numericId = Number(id);
    const task = await findById(numericId);
    if (!task) {
        return null;
    }

    await database.run('DELETE FROM tasks WHERE id = ?', [numericId]);
    return task;
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    deleteTask
};
