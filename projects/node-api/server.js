const app = require('./src/app');
const database = require('./src/database');

const PORT = process.env.PORT || 3000;

database.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao iniciar o banco de dados:', error);
    process.exit(1);
  });