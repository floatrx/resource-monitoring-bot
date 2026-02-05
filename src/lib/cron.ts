import cron from 'node-cron';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { checkAll } from '@/lib/checker';
import { getBot } from '@/lib/tg';
import { CRON_SCHEDULE, DEFAULT_CHAT_ID, DEFAULT_GROUP_ID } from '@/config/const';
import { LOGS_DIR } from '@/lib/logger';
const CRON_LOG_FILE = path.join(LOGS_DIR, 'cron.log');

// Convert cron expression to human-readable format
export const getCronHumanized = (): string => {
  const schedule = CRON_SCHEDULE;
  if (schedule === '* * * * *') return 'every minute';
  if (schedule.startsWith('*/')) {
    const minutes = schedule.split(' ')[0].replace('*/', '');
    return `every ${minutes} minutes`;
  }
  return schedule;
};

const saveLastRun = async () => {
  if (!existsSync(LOGS_DIR)) {
    await mkdir(LOGS_DIR, { recursive: true });
  }
  await writeFile(CRON_LOG_FILE, new Date().toISOString());
};

export const getLastCronRun = (): string | null => {
  if (!existsSync(CRON_LOG_FILE)) return null;
  return readFileSync(CRON_LOG_FILE, 'utf-8').trim();
};

export const startCronJobs = () => {
  console.log(`[cron] Starting scheduled checks: ${CRON_SCHEDULE}`);

  cron.schedule(CRON_SCHEDULE, async () => {
    console.log(`[cron] Running scheduled check...`);
    await saveLastRun();

    try {
      const { failed, total, message } = await checkAll({ onlyFailed: true });

      if (failed > 0) {
        console.log(`[cron] ${failed}/${total} failed - sending notification`);
        const chatIds = [DEFAULT_CHAT_ID, DEFAULT_GROUP_ID].filter(Boolean);

        if (chatIds.length === 0) {
          console.warn('[cron] No chatId or groupId configured - skipping notification');
        } else {
          const bot = getBot();
          for (const chatId of chatIds) {
            await bot.api.sendMessage(chatId, message, {
              parse_mode: 'Markdown',
            });
          }
        }
      } else {
        console.log(`[cron] ${total}/${total} healthy`);
      }
    } catch (err) {
      console.error(`[cron] Check failed:`, err);
    }
  });

  console.log(`[cron] Scheduler started`);
};
