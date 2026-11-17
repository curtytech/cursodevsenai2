const taskService = require('../services/taskService');

async function index(req, res) {
  try {
    const tasks = await taskService.getAlltasks();
    res.json(tasks);
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    res.status(500).json({ error: 'Erro ao obter usuários' });
  }
}

async function show(req, res) {
  try {
    console.log('ID do usuário:', req.params.id);
    const task = await taskService.gettaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(task);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Erro ao obter usuário' });
  }
}

async function create(req, res) {
  try {
    console.log('Dados do usuário:', req.body);
    const task = await taskService.createtask(req.body);
    console.log('Usuário criado com sucesso:', task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
}

async function update(req, res) {
  try {
    const task = await taskService.updatetask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
}

async function deletetask (req, res) {
  try {
    const task = await taskService.deletetask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
}

module.exports = {
  index,
  show,
  create,
  update,
  deletetask
};