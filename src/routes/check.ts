import { Router, type Router as RouterType } from 'express';
import { getBot } from '@/lib/tg';
import { checkAll } from '@/lib/checker';
import { DEFAULT_GROUP_ID } from '@/config/const';

export const checkRouter: RouterType = Router();

// Manual check trigger
checkRouter.get('/', (req, res) => {
  console.log('[GET] /api/check');
  const bot = getBot();

  checkAll({}).then(({ message, failed }) => {
    // Send only if check failed
    if (failed) {
      bot.api.sendMessage(DEFAULT_GROUP_ID, message);
    }
    console.log('[GET] /api/check > finished', message, failed);
  });

  return res.json({ message: 'job added to queue' });
});
