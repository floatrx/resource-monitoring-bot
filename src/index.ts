import express from 'express';
import { botRouter } from '@/routes/bot';
import { checkRouter } from '@/routes/check';
import { startCronJobs } from '@/lib/cron';
import { BOT_NAME } from '@/config/const';

const PORT = process.env.PORT || 3030;

const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/bot', botRouter);
app.use('/api/check', checkRouter);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: `${BOT_NAME} API`, version: '0.2.0' });
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startCronJobs();
});
