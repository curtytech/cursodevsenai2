const http = require('http');
const app = require('./src/app');
const database = require('./src/database');
const { attachLiveServer } = require('./src/services/geminiLiveRelay');

const PORT = process.env.PORT || 3000;

database.initialize()
  .then(() => {
    const server = http.createServer(app);
    attachLiveServer(server);

    server.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT} (HTTP + Gemini Live WS em /api/assistant/live)`);
    });
  })
  .catch((error) => {
    console.error('Erro ao iniciar o banco de dados:', error);
    process.exit(1);
  });
