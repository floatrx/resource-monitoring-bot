import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export type MonitorItem = {
  label: string;
  url: string;
  siteUrl?: string;
  options?: RequestInit;
};

type Config = {
  botToken: string;
  botName?: string;
  cronSchedule?: string;
  chatId?: string;
  groupId?: string;
  locked?: boolean;
  endpoints: MonitorItem[];
};

const CONFIG_PATH = process.env.CONFIG_PATH || './config.json';

export const loadConfig = (): Config => {
  const configPath = resolve(CONFIG_PATH);

  if (!existsSync(configPath)) {
    console.error(`[config] Config file not found: ${configPath}`);
    console.error('[config] Copy config.example.json to config.json and add your endpoints');
    process.exit(1);
  }

  try {
    const raw = readFileSync(configPath, 'utf-8');
    const config: Config = JSON.parse(raw);

    if (!config.botToken) {
      throw new Error('Config must have "botToken"');
    }

    if (!config.endpoints || !Array.isArray(config.endpoints)) {
      throw new Error('Config must have "endpoints" array');
    }

    if (config.endpoints.length === 0) {
      console.warn('[config] Warning: No endpoints configured');
    }

    console.log(`[config] Loaded ${config.endpoints.length} endpoints from ${configPath}`);
    return config;
  } catch (error) {
    console.error('[config] Failed to parse config:', (error as Error).message);
    process.exit(1);
  }
};

// Load config once at startup
const config = loadConfig();

export const TELEGRAM_BOT_TOKEN = config.botToken;
export const BOT_NAME = config.botName || 'Resource Monitor';
export const CRON_SCHEDULE = config.cronSchedule || '*/15 * * * *';
export let DEFAULT_CHAT_ID = config.chatId || '';
export let DEFAULT_GROUP_ID = config.groupId || '';
export let CONFIG_LOCKED = config.locked ?? false;
export const ENDPOINTS_TO_CHECK = config.endpoints;

// Save config to file
const saveConfig = () => {
  const configPath = resolve(CONFIG_PATH);
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`[config] Saved config to ${configPath}`);
};

// Register chat ID (private chat or group)
export const registerChatId = (chatId: string, isGroup: boolean): boolean => {
  if (isGroup) {
    if (config.groupId === chatId) return false; // Already registered
    config.groupId = chatId;
    DEFAULT_GROUP_ID = chatId;
  } else {
    if (config.chatId === chatId) return false; // Already registered
    config.chatId = chatId;
    DEFAULT_CHAT_ID = chatId;
  }
  saveConfig();
  return true;
};

// Remove chat ID (private chat or group)
export const removeChatId = (chatId: string, isGroup: boolean): boolean => {
  if (isGroup) {
    if (config.groupId !== chatId) return false; // Not registered
    config.groupId = '';
    DEFAULT_GROUP_ID = '';
  } else {
    if (config.chatId !== chatId) return false; // Not registered
    config.chatId = '';
    DEFAULT_CHAT_ID = '';
  }
  saveConfig();
  return true;
};

// Lock config (can only be unlocked manually)
export const lockConfig = (): void => {
  config.locked = true;
  CONFIG_LOCKED = true;
  saveConfig();
};
