import { CommandContext, Context, CallbackQueryContext } from 'grammy';

export type MessageCtx = CommandContext<Context> | CallbackQueryContext<Context>;
export type ReplyOptions = Parameters<MessageCtx['reply']>[1];
