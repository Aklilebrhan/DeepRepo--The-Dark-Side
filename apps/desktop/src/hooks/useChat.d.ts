export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp: string;
  references?: Array<{
    filePath: string;
    startLine: number;
    endLine: number;
    symbolName?: string;
  }>;
}
export interface ChatState {
  messages: ChatMessageItem[];
  isStreaming: boolean;
  addMessage: (msg: Omit<ChatMessageItem, 'id' | 'timestamp'>) => string;
  appendToLastMessage: (token: string) => void;
  finalizeLastMessage: (references?: ChatMessageItem['references']) => void;
  clearChat: () => void;
}
export declare const useChat: import('zustand').UseBoundStore<
  import('zustand').StoreApi<ChatState>
>;
//# sourceMappingURL=useChat.d.ts.map
