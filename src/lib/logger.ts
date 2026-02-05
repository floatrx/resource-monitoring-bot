import { appendFile, mkdir, readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const LOGS_DIR = path.join(process.cwd(), 'logs');

const ensureLogsDir = async () => {
  if (!existsSync(LOGS_DIR)) {
    await mkdir(LOGS_DIR, { recursive: true });
  }
};

const getLogFileName = () => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, `failures-${date}.log`);
};

export const logFailures = async (failures: string[]) => {
  if (failures.length === 0) return;

  await ensureLogsDir();

  const timestamp = new Date().toISOString();
  const logEntry = [
    `\n${'='.repeat(60)}`,
    `[${timestamp}] Check completed with ${failures.length} failure(s)`,
    '='.repeat(60),
    ...failures.map((f) => `  - ${f}`),
    '',
  ].join('\n');

  await appendFile(getLogFileName(), logEntry);
  console.log(`[logger] Logged ${failures.length} failure(s) to ${getLogFileName()}`);
};

/**
 * Get log files for a specific month (or current month if not specified)
 * @param month - Month in YYYY-MM format (e.g., "2026-01")
 * @returns Array of log file paths
 */
export const getLogFilesByMonth = async (month?: string): Promise<string[]> => {
  if (!existsSync(LOGS_DIR)) return [];

  const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
  const files = await readdir(LOGS_DIR);

  return files
    .filter((file) => file.startsWith(`failures-${targetMonth}`) && file.endsWith('.log'))
    .map((file) => path.join(LOGS_DIR, file))
    .sort();
};

/**
 * Get combined logs from the last N days as a single string
 * @param days - Number of days to look back (default: 30)
 * @returns Combined log content or null if no logs
 */
export const getCombinedLogs = async (days = 30): Promise<{ content: string; fileCount: number } | null> => {
  if (!existsSync(LOGS_DIR)) return null;

  const files = await readdir(LOGS_DIR);
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const cutoffStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD

  const logFiles = files
    .filter((file) => {
      const match = file.match(/^failures-(\d{4}-\d{2}-\d{2})\.log$/);
      return match && match[1] >= cutoffStr;
    })
    .sort()
    .reverse(); // newest first

  if (logFiles.length === 0) return null;

  const separator = '\n' + '─'.repeat(60) + '\n';
  const contents = await Promise.all(
    logFiles.map(async (file) => {
      const date = file.replace('failures-', '').replace('.log', '');
      const content = await readFile(path.join(LOGS_DIR, file), 'utf-8');
      return `📅 ${date}${separator}${content.trim()}`;
    }),
  );

  return { content: contents.join('\n\n'), fileCount: logFiles.length };
};

/**
 * Get available months that have log files
 * @returns Array of months in YYYY-MM format
 */
export const getAvailableLogMonths = async (): Promise<string[]> => {
  if (!existsSync(LOGS_DIR)) return [];

  const files = await readdir(LOGS_DIR);
  const months = new Set<string>();

  files.forEach((file) => {
    const match = file.match(/^failures-(\d{4}-\d{2})/);
    if (match) {
      months.add(match[1]);
    }
  });

  return Array.from(months).sort().reverse();
};
