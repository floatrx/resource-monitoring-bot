import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Europe/Kyiv';
const DATE_FORMAT = 'DD.MM.YYYY HH:mm';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Format date to Kyiv timezone
 * @param date - ISO string or Date object
 * @returns Formatted date string (e.g., "17.01.2026 20:21")
 */
export const formatDate = (date: string | Date): string => {
  return dayjs(date).tz(TIMEZONE).format(DATE_FORMAT);
};
