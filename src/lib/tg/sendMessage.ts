import { getCommands } from '@/lib/tg/getCommands';
import type { MessageCtx } from '@/types';

// Default sendMessage wrapper
export const sendMessage = async (ctx: MessageCtx, message: string) => {
  const { opts } = await getCommands(ctx);
  return await ctx.reply(message, opts);
};
