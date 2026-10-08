import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Send, Terminal, RotateCcw } from 'lucide-react';
import { ChatMessage, Button } from '@deeprepo/ui-shared';
import { useChat } from '../hooks/useChat';
export const ChatWindow = ({ onSendMessage, isReady }) => {
    const { messages, isStreaming, clearChat } = useChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isStreaming)
            return;
        const query = input.trim();
        setInput('');
        onSendMessage(query);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };
    return (_jsxs("div", { className: "flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Terminal, { size: 16, className: "text-emerald-400" }), _jsx("span", { className: "text-xs font-semibold text-slate-200", children: "Semantic Code Assistant" }), _jsx("span", { className: "text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono", children: "RAG Offline" })] }), _jsxs("button", { onClick: clearChat, className: "text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded transition-colors", title: "Clear conversation history", children: [_jsx(RotateCcw, { size: 12 }), _jsx("span", { children: "Clear" })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.map((msg) => (_jsx(ChatMessage, { role: msg.role, content: msg.content, isStreaming: msg.isStreaming, timestamp: msg.timestamp, references: msg.references }, msg.id))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "p-3 bg-slate-900/90 border-t border-slate-800", children: [_jsxs("form", { onSubmit: handleSubmit, className: "flex gap-2 items-end", children: [_jsx("div", { className: "relative flex-1", children: _jsx("textarea", { rows: 2, value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, disabled: !isReady, placeholder: isReady
                                        ? 'Ask anything about your codebase (e.g. "How does authentication work?")...'
                                        : 'Select and index a repository first...', className: "w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50 transition-colors" }) }), _jsx(Button, { type: "submit", variant: "primary", size: "md", disabled: !input.trim() || isStreaming || !isReady, isLoading: isStreaming, className: "h-10 self-center", children: _jsx(Send, { size: 14 }) })] }), _jsxs("div", { className: "flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1", children: [_jsx("span", { children: "Press Enter to send, Shift+Enter for new line" }), _jsx("span", { children: "Zero cloud latency \u2022 Offline Ollama" })] })] })] }));
};
//# sourceMappingURL=ChatWindow.js.map