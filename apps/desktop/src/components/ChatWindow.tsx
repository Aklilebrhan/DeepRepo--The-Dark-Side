import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, RotateCcw } from 'lucide-react';
import { ChatMessage, Button } from '@deeprepo/ui-shared';
import { useChat } from '../hooks/useChat';

export interface ChatWindowProps {
  onSendMessage: (query: string) => void;
  isReady: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onSendMessage, isReady }) => {
  const { messages, isStreaming, clearChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const query = input.trim();
    setInput('');
    onSendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Semantic Code Assistant</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            RAG Offline
          </span>
        </div>
        <button
          onClick={clearChat}
          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
          title="Clear conversation history"
        >
          <RotateCcw size={12} />
          <span>Clear</span>
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={msg.isStreaming}
            timestamp={msg.timestamp}
            references={msg.references}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isReady}
              placeholder={
                isReady
                  ? 'Ask anything about your codebase (e.g. "How does authentication work?")...'
                  : 'Select and index a repository first...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50 transition-colors"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!input.trim() || isStreaming || !isReady}
            isLoading={isStreaming}
            className="h-10 self-center"
          >
            <Send size={14} />
          </Button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Zero cloud latency • Offline Ollama</span>
        </div>
      </div>
    </div>
  );
};
