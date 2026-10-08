import { create } from 'zustand';

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

export const useChat = create<ChatState>((set) => ({
  messages: [
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        '👋 Welcome to **DeepRepo (The Dark Side)** – your 100% offline codebase intelligence partner.\n\nSelect a local Git repository and index it to start asking architectural questions, generating test suites, or exploring code logic privately.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  isStreaming: false,
  addMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newMsg: ChatMessageItem = {
      ...msg,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({
      messages: [...state.messages, newMsg],
      isStreaming: msg.isStreaming ?? false,
    }));
    return id;
  },
  appendToLastMessage: (token) => {
    set((state) => {
      if (state.messages.length === 0) return state;
      const last = { ...state.messages[state.messages.length - 1] };
      last.content += token;
      return {
        messages: [...state.messages.slice(0, -1), last],
      };
    });
  },
  finalizeLastMessage: (references) => {
    set((state) => {
      if (state.messages.length === 0) return { isStreaming: false };
      const last = { ...state.messages[state.messages.length - 1] };
      last.isStreaming = false;
      if (references) {
        last.references = references;
      }
      return {
        messages: [...state.messages.slice(0, -1), last],
        isStreaming: false,
      };
    });
  },
  clearChat: () => set({ messages: [], isStreaming: false }),
}));
