// Re-export from config.json
export {
  BOT_NAME,
  CONFIG_LOCKED,
  CRON_SCHEDULE,
  DEFAULT_CHAT_ID,
  DEFAULT_GROUP_ID,
  ENDPOINTS_TO_CHECK,
  TELEGRAM_BOT_TOKEN,
  type MonitorItem,
} from '@/config/loadConfig';

// App constants
export const DELAY_BETWEEN_CHECKS_MS = 600;
export const APP_VERSION = process.env.npm_package_version;
