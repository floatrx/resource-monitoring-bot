import { getBot } from '@/lib/tg';
import { checkAll } from '@/lib/checker';
import { DEFAULT_GROUP_ID } from '@/config/const';

// Manual check trigger (fire-and-forget)
export const handleCheck = () => {
  console.log('[check] Manual check triggered');

  checkAll({}).then(({ message, failed }) => {
    if (failed) {
      const bot = getBot();
      bot.api.sendMessage(DEFAULT_GROUP_ID, message);
    }
    console.log('[check] Finished', message, failed);
  });
};
