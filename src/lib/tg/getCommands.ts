import type { ReplyOptions, MessageCtx } from '@/types';
import { getKeyboard } from '@/lib/tg/getKeyboard';

export type GetCommandsReturn = {
  opts: ReplyOptions;
  subscribedDate: string | null;
};

export const getCommands = async (ctx: MessageCtx, { withKeyboard = true } = {}) => {
  let opts: ReplyOptions = {
    link_preview_options: { is_disabled: true },
    parse_mode: 'Markdown',
    disable_notification: true,
  };
  if (!ctx)
    return {
      opts,
      subscribedDate: null,
    } as GetCommandsReturn;

  if (!ctx.chat?.id) {
    console.error('Fatal! Invalid chat id');
    return { opts, subscribedDate: null } as GetCommandsReturn;
  }

  opts = {
    parse_mode: 'Markdown',
    ...(withKeyboard && { reply_markup: getKeyboard() }),
  };

  if (ctx.message?.text !== '/start') {
    try {
      await ctx.deleteMessage();
    } catch (err) {
      console.log('Failed to delete message', err);
    }
  }

  return { opts };
};
