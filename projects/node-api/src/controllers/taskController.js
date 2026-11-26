const taskService = require('../services/taskService');

async function index(req, res) {
  try {
    const tasks = await taskService.getAlltasks();
    res.json(tasks);
  } catch (error) {
    console.error('Erro ao obter tarefas:', error);
    res.status(500).json({ error: 'Erro ao obter tarefas' });
  }
}

async function show(req, res) {
  try {
    const task = await taskService.gettaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json(task);
  } catch (error) {
    console.error('Erro ao obter tarefa:', error);
    res.status(500).json({ error: 'Erro ao obter tarefa' });
  }
}

async function create(req, res) {
  try {
    const task = await taskService.createtask(req.body);
    res.status(201).json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
}

async function update(req, res) {
  try {
    const task = await taskService.updatetask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
}

async function deleteTask (req, res) {
  try {
    const task = await taskService.deleteTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ error: 'Erro ao excluir tarefa' });
  }
}

module.exports = {
  index,
  show,
  create,
  update,
  deleteTask
};