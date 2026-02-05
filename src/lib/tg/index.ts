import { Bot, InputFile } from 'grammy';
import { getCommands } from '@/lib/tg/getCommands';
import { getKeyboard } from '@/lib/tg/getKeyboard';
import { BOT_NAME, CONFIG_LOCKED, ENDPOINTS_TO_CHECK, TELEGRAM_BOT_TOKEN, APP_VERSION } from '@/config/const';
import { registerChatId, removeChatId, lockConfig } from '@/config/loadConfig';
import { checkAll } from '@/lib/checker';
import { getCombinedLogs } from '@/lib/logger';
import { getLastCronRun, getCronHumanized } from '@/lib/cron';
import { formatDate } from '@/lib/helpers';

const initBot = (bot: Bot) => {
  console.log('[tg] initBot');

  bot.command('start', async (ctx) => {
    const { opts } = await getCommands(ctx);
    const version = APP_VERSION || 'unknown';
    const welcomeMessage = `👋 Hello, *${ctx.from?.username}*!

I'm *${BOT_NAME}* v${version} — your endpoint monitoring bot.

Use buttons below or commands:
• */info* — version & scheduler status
• */logs* — download failure logs

Monitoring *${ENDPOINTS_TO_CHECK.length}* endpoints`;

    await ctx.reply(welcomeMessage, opts);
  });

  bot.command('list', async (ctx) => {
    const { opts } = await getCommands(ctx);
    const list = ENDPOINTS_TO_CHECK.map(({ label, siteUrl, url }) => `• ${label}\n  ${siteUrl || url}`).join('\n');
    await ctx.reply(`📋 *Monitored resources (${ENDPOINTS_TO_CHECK.length}):*\n\n${list}`, {
      ...opts,
      link_preview_options: { is_disabled: true },
    });
  });

  bot.command('status', async (ctx) => {
    const statusMsg = await ctx.reply('⏳ Checking: 0% completed');
    checkAll({
      onlyFailed: false,
      onProgress: async (msg) => {
        try {
          await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, msg);
        } catch {
          console.error('Failed to edit status message');
        }
      },
    }).then(async ({ message }) => {
      await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, message, {
        parse_mode: 'Markdown',
        link_preview_options: { is_disabled: true },
      });
    });
  });

  bot.command('logs', async (ctx) => {
    const { opts } = await getCommands(ctx);
    const logs = await getCombinedLogs();

    if (!logs) {
      await ctx.reply('📭 No logs for last month');
      return;
    }

    const fileName = `logs-${new Date().toISOString().split('T')[0]}.txt`;
    await ctx.replyWithDocument(new InputFile(Buffer.from(logs.content), fileName), opts);
  });

  bot.command('info', async (ctx) => {
    const { opts } = await getCommands(ctx);
    const lastRun = getLastCronRun();
    const interval = getCronHumanized();
    const version = APP_VERSION || 'unknown';
    if (!lastRun) {
      await ctx.reply(`🤖 *v${version}*\n🕐 Cron has not run yet.\n\n*Schedule:* ${interval}`, opts);
      return;
    }
    await ctx.reply(`🤖 *v${version}*\n🕐 *Last run:* ${formatDate(lastRun)}\n*Schedule:* ${interval}`, opts);
  });

  bot.command('add', async (ctx) => {
    if (CONFIG_LOCKED) {
      await ctx.reply('🔒 Configuration is locked. Contact the administrator.');
      return;
    }

    const chatId = String(ctx.chat.id);
    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    const chatType = isGroup ? 'group' : 'chat';

    const registered = registerChatId(chatId, isGroup);

    if (registered) {
      await ctx.reply(`✅ This ${chatType} is now registered for notifications.\n\n*ID:* \`${chatId}\``, {
        parse_mode: 'Markdown',
      });
    } else {
      await ctx.reply(`ℹ️ This ${chatType} is already registered.\n\n*ID:* \`${chatId}\``, {
        parse_mode: 'Markdown',
      });
    }
  });

  bot.command('remove', async (ctx) => {
    if (CONFIG_LOCKED) {
      await ctx.reply('🔒 Configuration is locked. Contact the administrator.');
      return;
    }

    const chatId = String(ctx.chat.id);
    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    const chatType = isGroup ? 'group' : 'chat';

    const removed = removeChatId(chatId, isGroup);

    if (removed) {
      await ctx.reply(`🗑 This ${chatType} has been removed from notifications.`, {
        parse_mode: 'Markdown',
      });
    } else {
      await ctx.reply(`ℹ️ This ${chatType} was not registered.`, {
        parse_mode: 'Markdown',
      });
    }
  });

  bot.command('lock', async (ctx) => {
    if (CONFIG_LOCKED) {
      await ctx.reply('🔒 Configuration is already locked.');
      return;
    }

    lockConfig();
    await ctx.reply(
      '🔒 Configuration is now locked.\n\n`/add` and `/remove` commands are disabled.\n\nTo unlock, manually set `"locked": false` in config.json and restart.',
      {
        parse_mode: 'Markdown',
      },
    );
  });

  bot.callbackQuery('start', async (ctx) => {
    const { opts } = await getCommands(ctx);
    return ctx.reply('Welcome back!', opts);
  });

  bot.callbackQuery('check', async (ctx) => {
    console.log('[callbackQuery] check-all started');
    try {
      await ctx.editMessageText('⏳ Checking: 0% completed');
    } catch {
      console.error('Failed to edit [1]');
    }
    checkAll({
      onProgress: async (msg) => {
        try {
          await ctx.editMessageText(msg);
        } catch {
          console.error('Failed to edit [2]');
        }
      },
    }).then(async ({ message }) => {
      const { opts } = await getCommands(ctx);
      await ctx.api.sendMessage(ctx.chat!.id, message, opts);
    });
  });

  bot.callbackQuery('status', async (ctx) => {
    console.log('[callbackQuery] status started');
    try {
      await ctx.editMessageText('⏳ Checking: 0% completed');
    } catch {
      console.error('Failed to edit status message');
    }
    checkAll({
      onlyFailed: false,
      onProgress: async (msg) => {
        try {
          await ctx.editMessageText(msg);
        } catch {
          console.error('Failed to edit status progress');
        }
      },
    }).then(async ({ message }) => {
      const { opts } = await getCommands(ctx);
      await ctx.api.sendMessage(ctx.chat!.id, message, opts);
    });
  });

  bot.callbackQuery('list', async (ctx) => {
    console.log('[callbackQuery] list');
    const list = ENDPOINTS_TO_CHECK.map(({ label, siteUrl, url }) => `• ${label}\n  ${siteUrl || url}`).join('\n');
    try {
      await ctx.editMessageText(`📋 *Monitored resources (${ENDPOINTS_TO_CHECK.length}):*\n\n${list}`, {
        parse_mode: 'Markdown',
        link_preview_options: { is_disabled: true },
      });
    } catch {
      console.error('Failed to edit list message');
    }
    await ctx.api.sendMessage(ctx.chat!.id, '👆 Endpoints list above', {
      reply_markup: getKeyboard(),
      parse_mode: 'Markdown',
    });
  });

  bot.callbackQuery('logs', async (ctx) => {
    console.log('[callbackQuery] logs');
    const logs = await getCombinedLogs();

    if (!logs) {
      try {
        await ctx.editMessageText('📭 No logs for last month');
      } catch {
        console.error('Failed to edit logs message');
      }
      return;
    }

    try {
      await ctx.deleteMessage();
    } catch {
      console.error('Failed to delete message');
    }

    const fileName = `logs-${new Date().toISOString().split('T')[0]}.txt`;
    await ctx.api.sendDocument(ctx.chat!.id, new InputFile(Buffer.from(logs.content), fileName), {
      reply_markup: getKeyboard(),
    });
  });
};

// Encapsulate the bot instance within a closure to ensure it's a singleton
export const botSingleton = (() => {
  let bot: Bot | null = null;

  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[tg] TELEGRAM_BOT_TOKEN is not set');
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  return {
    create: () => {
      if (bot) return bot;

      console.log('[tg] Bot initialized');

      if (!TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN environment variable not found.');
      }

      // Create new bot
      bot = new Bot(TELEGRAM_BOT_TOKEN);

      initBot(bot);

      return bot;
    },
  };
})();

// Export a function to access the singleton instance
export const getBot = botSingleton.create;
