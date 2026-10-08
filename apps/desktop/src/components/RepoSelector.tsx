import React, { useState } from 'react';
import { FolderGit2, GitBranch, RefreshCw, FolderSearch } from 'lucide-react';
import { useRepository } from '../hooks/useRepository';
import { selectRepositoryDialog } from '../tauri-commands';
import { Button } from '@deeprepo/ui-shared';

export interface RepoSelectorProps {
  onIndexRequest: (path: string) => void;
  isIndexing: boolean;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({ onIndexRequest, isIndexing }) => {
  const { repoPath, setRepoPath, isIndexed, branch, totalChunks, lastIndexedAt } = useRepository();
  const [inputVal, setInputVal] = useState(repoPath);

  const handleBrowse = async () => {
    const selected = await selectRepositoryDialog();
    if (selected) {
      setInputVal(selected);
      setRepoPath(selected);
    }
  };

  const handleSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setRepoPath(inputVal.trim());
      onIndexRequest(inputVal.trim());
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FolderGit2 size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Active Repository
              {isIndexed && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  Indexed ({totalChunks} chunks)
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-[400px]">
              {repoPath ? repoPath : 'No repository currently selected'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSelect} className="flex items-center gap-2 flex-1 sm:justify-end">
          <div className="relative flex-1 sm:max-w-md">
            <input
              type="text"
              placeholder="e.g. C:\Projects\my-repo"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleBrowse}
            title="Browse filesystem"
          >
            <FolderSearch size={14} />
            <span className="hidden sm:inline">Browse</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputVal.trim() || isIndexing}
            isLoading={isIndexing}
          >
            <RefreshCw size={14} className={isIndexing ? 'animate-spin' : ''} />
            <span>{isIndexed ? 'Re-index' : 'Index Codebase'}</span>
          </Button>
        </form>
      </div>

      {repoPath && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300">
              <GitBranch size={13} className="text-emerald-400" />
              <span>{branch}</span>
            </span>
            {lastIndexedAt && (
              <span>Last indexed: {new Date(lastIndexedAt).toLocaleTimeString()}</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">100% Local • Zero Cloud Sync</span>
        </div>
      )}
    </div>
  );
};
