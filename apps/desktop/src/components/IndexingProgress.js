import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, AlertCircle, FileCode, Cpu, Database } from 'lucide-react';
import { useIndexing } from '../hooks/useIndexing';
export const IndexingProgress = () => {
    const { isIndexing, progress, error } = useIndexing();
    if (!isIndexing && !progress && !error)
        return null;
    const filesDone = progress?.filesScanned || 0;
    const filesTotal = progress?.totalFiles || 0;
    const chunksDone = progress?.chunksCreated || 0;
    const embDone = progress?.embeddingsDone || 0;
    const embTotal = progress?.totalChunks || 0;
    const percent = progress?.phase === 'completed'
        ? 100
        : embTotal > 0
            ? Math.round((embDone / embTotal) * 100)
            : filesTotal > 0
                ? Math.round((filesDone / filesTotal) * 50)
                : 10;
    return (_jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [error ? (_jsx(AlertCircle, { size: 18, className: "text-rose-400" })) : progress?.phase === 'completed' ? (_jsx(CheckCircle2, { size: 18, className: "text-emerald-400" })) : (_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" })), _jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-slate-200", children: error
                                    ? 'Indexing Error'
                                    : progress?.phase === 'completed'
                                        ? 'Indexing Completed'
                                        : `Phase: ${progress?.phase || 'Initializing'}...` })] }), _jsxs("span", { className: "text-xs font-mono text-emerald-400 font-bold", children: [percent, "%"] })] }), _jsx("div", { className: "w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-3 border border-slate-800", children: _jsx("div", { className: "bg-gradient-to-r from-emerald-600 to-teal-400 h-full transition-all duration-300", style: { width: `${percent}%` } }) }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { className: "bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center gap-2", children: [_jsx(FileCode, { size: 14, className: "text-blue-400" }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] text-slate-500 uppercase", children: "Files Scanned" }), _jsxs("div", { className: "font-mono text-slate-200", children: [filesDone, " / ", filesTotal || '...'] })] })] }), _jsxs("div", { className: "bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center gap-2", children: [_jsx(Cpu, { size: 14, className: "text-purple-400" }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] text-slate-500 uppercase", children: "AST Chunks" }), _jsx("div", { className: "font-mono text-slate-200", children: chunksDone })] })] }), _jsxs("div", { className: "bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center gap-2", children: [_jsx(Database, { size: 14, className: "text-emerald-400" }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] text-slate-500 uppercase", children: "Embeddings" }), _jsxs("div", { className: "font-mono text-slate-200", children: [embDone, " / ", embTotal || '...'] })] })] })] }), progress?.currentFile && (_jsxs("div", { className: "mt-2 text-[11px] text-slate-400 truncate font-mono", children: ["Parsing: ", progress.currentFile] })), error && _jsx("div", { className: "mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded", children: error })] }));
};
//# sourceMappingURL=IndexingProgress.js.map