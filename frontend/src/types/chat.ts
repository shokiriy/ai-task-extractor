export type ChatRole = 'USER' | 'ASSISTANT';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResponse {
  message: string;
}
