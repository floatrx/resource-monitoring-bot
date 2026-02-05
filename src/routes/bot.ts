import { Router, type Router as RouterType } from 'express';
import { webhookCallback } from 'grammy';
import { getBot } from '@/lib/tg';

export const botRouter: RouterType = Router();

const bot = getBot();

// Health check
botRouter.get('/', (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ message: 'Invalid chat id' });
  }
  return res.json({ message: 'server up and running', status: 200 });
});

// Telegram webhook
botRouter.post('/', webhookCallback(bot, 'express'));
