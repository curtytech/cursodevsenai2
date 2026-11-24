const database = require('../src/database');

database.initialize()
  .then(() => {
    console.log('Migrations executadas com sucesso.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar migrations:', error);
    process.exit(1);
  });
