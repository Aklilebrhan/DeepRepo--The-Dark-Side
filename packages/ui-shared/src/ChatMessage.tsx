import React from 'react';
import { User, Bot, Sparkles } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

export interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  timestamp?: string;
  references?: Array<{
    filePath: string;
    startLine: number;
    endLine: number;
    symbolName?: string;
  }>;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  isStreaming = false,
  timestamp,
  references,
}) => {
  const isUser = role === 'user';

  // Parses markdown code blocks ```lang ... ```
  const renderFormattedContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed my-1">
            {text.slice(lastIndex, match.index)}
          </div>,
        );
      }
      const lang = match[1] || 'text';
      const code = match[2];
      parts.push(
        <div key={`code-${match.index}`} className="my-3">
          <CodeBlock code={code} language={lang} />
        </div>,
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed my-1">
          {text.slice(lastIndex)}
        </div>,
      );
    }

    return parts;
  };

  return (
    <div
      className={`flex gap-3.5 p-4 rounded-xl transition-colors ${
        isUser
          ? 'bg-slate-900/60 border border-slate-800/80 ml-8'
          : 'bg-slate-950/80 border border-slate-900 mr-8 shadow-sm'
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
            : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="flex-1 overflow-hidden space-y-2 text-sm text-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
          <span className="font-semibold text-slate-300">
            {isUser ? 'You' : 'DeepRepo Assistant'}
          </span>
          {timestamp && <span>{timestamp}</span>}
        </div>

        <div className="prose prose-invert max-w-none text-slate-200">
          {renderFormattedContent(content)}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse align-middle" />
          )}
        </div>

        {references && references.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60 text-xs flex flex-wrap gap-2 items-center">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Sparkles size={12} className="text-emerald-400" /> Attributed Context:
            </span>
            {references.map((ref, idx) => (
              <span
                key={idx}
                className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono text-[11px]"
              >
                {ref.filePath}:{ref.startLine}-{ref.endLine}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
