import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FolderGit2, GitBranch, RefreshCw, FolderSearch } from 'lucide-react';
import { useRepository } from '../hooks/useRepository';
import { selectRepositoryDialog } from '../tauri-commands';
import { Button } from '@deeprepo/ui-shared';
export const RepoSelector = ({ onIndexRequest, isIndexing }) => {
    const { repoPath, setRepoPath, isIndexed, branch, totalChunks, lastIndexedAt } = useRepository();
    const [inputVal, setInputVal] = useState(repoPath);
    const handleBrowse = async () => {
        const selected = await selectRepositoryDialog();
        if (selected) {
            setInputVal(selected);
            setRepoPath(selected);
        }
    };
    const handleSelect = (e) => {
        e.preventDefault();
        if (inputVal.trim()) {
            setRepoPath(inputVal.trim());
            onIndexRequest(inputVal.trim());
        }
    };
    return (_jsxs("div", { className: "bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400", children: _jsx(FolderGit2, { size: 20 }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-sm font-semibold text-slate-100 flex items-center gap-2", children: ["Active Repository", isIndexed && (_jsxs("span", { className: "bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium", children: ["Indexed (", totalChunks, " chunks)"] }))] }), _jsx("p", { className: "text-xs text-slate-400 truncate max-w-[280px] sm:max-w-[400px]", children: repoPath ? repoPath : 'No repository currently selected' })] })] }), _jsxs("form", { onSubmit: handleSelect, className: "flex items-center gap-2 flex-1 sm:justify-end", children: [_jsx("div", { className: "relative flex-1 sm:max-w-md", children: _jsx("input", { type: "text", placeholder: "e.g. C:\\Projects\\my-repo", value: inputVal, onChange: (e) => setInputVal(e.target.value), className: "w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" }) }), _jsxs(Button, { type: "button", variant: "secondary", size: "sm", onClick: handleBrowse, title: "Browse filesystem", children: [_jsx(FolderSearch, { size: 14 }), _jsx("span", { className: "hidden sm:inline", children: "Browse" })] }), _jsxs(Button, { type: "submit", variant: "primary", size: "sm", disabled: !inputVal.trim() || isIndexing, isLoading: isIndexing, children: [_jsx(RefreshCw, { size: 14, className: isIndexing ? 'animate-spin' : '' }), _jsx("span", { children: isIndexed ? 'Re-index' : 'Index Codebase' })] })] })] }), repoPath && (_jsxs("div", { className: "mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "flex items-center gap-1 text-slate-300", children: [_jsx(GitBranch, { size: 13, className: "text-emerald-400" }), _jsx("span", { children: branch })] }), lastIndexedAt && (_jsxs("span", { children: ["Last indexed: ", new Date(lastIndexedAt).toLocaleTimeString()] }))] }), _jsx("span", { className: "text-[11px] text-slate-500", children: "100% Local \u2022 Zero Cloud Sync" })] }))] }));
};
//# sourceMappingURL=RepoSelector.js.map