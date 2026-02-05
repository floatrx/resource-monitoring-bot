import { InlineKeyboard } from 'grammy';

export const getKeyboard = (): InlineKeyboard => {
  return new InlineKeyboard()
    .text('🏓 Check (failures only)', 'check')
    .text('📊 Full Status', 'status')
    .row()
    .text('📋 List resources', 'list')
    .text('📁 Logs', 'logs');
};
