import { DELAY_BETWEEN_CHECKS_MS, ENDPOINTS_TO_CHECK } from '@/config/const';
import { delay } from '@/lib/helpers';
import { logFailures } from '@/lib/logger';
import { throttle } from 'lodash';

type TestOptions = {
  shouldSendMessage?: boolean;
  onlyFailed?: boolean;
  onProgress?: (msg: string) => void;
};

// Extract detailed error message from fetch error
const getErrorDetails = (err: Error): string => {
  const cause = (err as Error & { cause?: { code?: string; message?: string } }).cause;
  if (cause?.code) {
    // Network errors like ENOTFOUND, ECONNREFUSED, ETIMEDOUT
    const codes: Record<string, string> = {
      ENOTFOUND: 'DNS lookup failed',
      ECONNREFUSED: 'Connection refused',
      ETIMEDOUT: 'Connection timeout',
      ECONNRESET: 'Connection reset',
      CERT_HAS_EXPIRED: 'SSL certificate expired',
    };
    return codes[cause.code] || cause.code;
  }
  return err.message || 'Unknown error';
};

async function requestWithRetry(url: string, options: RequestInit = {}, retries = 3) {
  const MAX_RETRIES = retries;
  let error: Error | null = null;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      error = err as Error;
      console.log(`[checker] Attempt ${i + 1} failed. Retrying...`);
    }
  }

  const details = getErrorDetails(error!);
  console.error('[checker] Error:', details);
  throw new Error(details);
}

export const checkAll = async ({ onlyFailed = true, onProgress = () => {} }: TestOptions = {}): Promise<{
  message: string;
  failed: number;
  total: number;
}> => {
  let report = '';
  const failures: string[] = [];
  console.log('[checker] Manual checker started!...');

  const totalEndpoints = ENDPOINTS_TO_CHECK.length;
  let currentEndpoint = 0;

  const throttledOnProgress = throttle(onProgress, 2500);

  for (const { label, url, siteUrl, options } of ENDPOINTS_TO_CHECK) {
    try {
      await delay(DELAY_BETWEEN_CHECKS_MS);
      console.log(`[checker] ${label}`, options);
      const res = await requestWithRetry(url, options);
      console.log(`[checker] ${label} Response status:`, res.status);
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText || 'Error'}`);
      }
      if (!onlyFailed) report += `🟢 ${label}\n`;
    } catch (error) {
      const errorMessage = (error as Error).message;
      const failureEntry = `${label} · ${siteUrl || url} (${errorMessage})`;
      failures.push(failureEntry);
      report += `🔴 ${failureEntry}\n`;
      console.log(`[checker] ❌ ${label} (${errorMessage})`);
    }

    currentEndpoint++;
    const percentage = ((currentEndpoint / totalEndpoints) * 100).toFixed();
    throttledOnProgress(`⏳ Checking: ${percentage}% completed\n • ${label}`);
  }

  // Log failures to file
  if (failures.length > 0) {
    await logFailures(failures);
  }

  return {
    message: report || '✅ Check completed! All sites up & running.',
    failed: failures.length,
    total: totalEndpoints,
  };
};
