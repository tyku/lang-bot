export type TInlineKeyboardButton = {
  text: string;
  callback_data: string;
  toggle?: string;
};

export type TInlineKeyboard = {
  text: string;
  replyType: 'inline_keyboard';
  buttons: TInlineKeyboardButton[][];
};
