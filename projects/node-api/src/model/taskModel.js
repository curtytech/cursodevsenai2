const database = require('../database');

function mapTaskRow(row) {
    if (!row) {
        return undefined;
    }

    return {
        id: row.id,
        title: row.title,
        is_completed: Boolean(row.is_completed)
    };
}

async function findAll() {
    await database.ensureInitialized();
    const rows = await database.all('SELECT id, title, is_completed FROM tasks ORDER BY id');
    return rows.map(mapTaskRow);
}

async function findById(id) {
    await database.ensureInitialized();
    const numericId = Number(id);
    const row = await database.get('SELECT id, title, is_completed FROM tasks WHERE id = ?', [numericId]);
    return mapTaskRow(row);
}


async function create(taskData = {}) {
    await database.ensureInitialized();

    const title = taskData.title?.trim();
    const is_completed = taskData.is_completed ? 1 : 0;

    if (!title) {
        const error = new Error('Título é obrigatório');
        error.statusCode = 400;
        throw error;
    }

    const result = await database.run('INSERT INTO tasks (title, is_completed) VALUES (?, ?)', [title, is_completed]);
    return findById(result.lastID);
}


async function update(id, taskData = {}) {
    await database.ensureInitialized();

    const numericId = Number(id);
    const currentTask = await findById(numericId);
    if (!currentTask) {
        return null;
    }

    const nextTitle = taskData.title !== undefined ? String(taskData.title).trim() : currentTask.title;
    if (!nextTitle) {
        const error = new Error('Título é obrigatório');
        error.statusCode = 400;
        throw error;
    }

    const nextCompleted = taskData.is_completed !== undefined
        ? (taskData.is_completed ? 1 : 0)
        : (currentTask.is_completed ? 1 : 0);

    await database.run('UPDATE tasks SET title = ?, is_completed = ? WHERE id = ?', [nextTitle, nextCompleted, numericId]);
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
