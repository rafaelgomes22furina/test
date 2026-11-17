/**
 * [MUDANÇA · BACKEND] Ponto de entrada: `npm start` → http://localhost:3000
 * Serve o frontend (pasta /frontend) e a API (/api/*) no mesmo processo.
 */
const config = require('./src/config');
const { createApp } = require('./src/app');

const { app, repo } = createApp();
const server = app.listen(config.port, () => {
  console.log(`MegaLoja Click & Collect rodando em http://localhost:${config.port}`);
});

// Encerramento limpo: espera a última gravação de pedidos terminar.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(async () => {
      await repo.flush();
      process.exit(0);
    });
  });
}
