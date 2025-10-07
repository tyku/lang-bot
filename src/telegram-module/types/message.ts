export type TMessageType = {
  messageId: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    language_code: string;
    is_premium: string;
  };
  chat: {
    id: number;
    first_name: string;
    username: string;
    type: string;
  };
  date: number;
  text: string;
  entities: [{ offset: number; length: number; type: string }];
};
