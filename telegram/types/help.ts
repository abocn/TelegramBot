interface MessageOptions {
  parse_mode: string;
  disable_web_page_preview: boolean;
  reply_markup: {
    inline_keyboard: { text: string; callback_data: string; }[][];
  };
  reply_to_message_id?: number;
};

export type { MessageOptions };