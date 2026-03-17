import { createServer } from 'http';
import { getBot } from '@/lib/tg';
import { startCronJobs } from '@/lib/cron';
import { handleCheck } from '@/routes/check';
import { BOT_NAME } from '@/config/const';
import { APP_VERSION } from '@/config/const';

const PORT = process.env.PORT || 3030;

// Minimal HTTP server for health checks and manual triggers
const server = createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health') {
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (req.url === '/api/check' && req.method === 'GET') {
    handleCheck();
    res.end(JSON.stringify({ message: 'job added to queue' }));
    return;
  }

  if (req.url === '/') {
    res.end(JSON.stringify({ message: `${BOT_NAME} API`, version: APP_VERSION }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ message: 'not found' }));
});

// Graceful shutdown
const bot = getBot();

const shutdown = () => {
  console.log('Shutting down gracefully...');
  bot.stop();
  server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start bot with long polling
bot.start({
  onStart: () => {
    console.log(`🤖 Bot started (long polling)`);
    startCronJobs();
  },
});

// Start HTTP server
server.listen(PORT, () => {
  console.log(`🚀 HTTP server on http://localhost:${PORT}`);
});
