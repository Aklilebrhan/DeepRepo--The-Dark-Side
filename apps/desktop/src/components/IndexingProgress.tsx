import React from 'react';
import { CheckCircle2, AlertCircle, FileCode, Cpu, Database } from 'lucide-react';
import { useIndexing } from '../hooks/useIndexing';

export const IndexingProgress: React.FC = () => {
  const { isIndexing, progress, error } = useIndexing();

  if (!isIndexing && !progress && !error) return null;

  const filesDone = progress?.filesScanned || 0;
  const filesTotal = progress?.totalFiles || 0;
  const chunksDone = progress?.chunksCreated || 0;
  const embDone = progress?.embeddingsDone || 0;
  const embTotal = progress?.totalChunks || 0;

  const percent =
    progress?.phase === 'completed'
      ? 100
      : embTotal > 0
        ? Math.round((embDone / embTotal) * 100)
        : filesTotal > 0
          ? Math.round((filesDone / filesTotal) * 50)
          : 10;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {error ? (
            <AlertCircle size={18} className="text-rose-400" />
          ) : progress?.phase === 'completed' ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {error
              ? 'Indexing Error'
              : progress?.phase === 'completed'
                ? 'Indexing Completed'
                : `Phase: ${progress?.phase || 'Initializing'}...`}
          </span>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-bold">{percent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden mb-3 border border-slate-800">
        <div
          className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
          <FileCode size={14} className="text-blue-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Files Scanned</div>
            <div className="font-mono text-slate-200">
              {filesDone} / {filesTotal || '...'}
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
          <Cpu size={14} className="text-purple-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase">AST Chunks</div>
            <div className="font-mono text-slate-200">{chunksDone}</div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
          <Database size={14} className="text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Embeddings</div>
            <div className="font-mono text-slate-200">
              {embDone} / {embTotal || '...'}
            </div>
          </div>
        </div>
      </div>

      {progress?.currentFile && (
        <div className="mt-2 text-[11px] text-slate-400 truncate font-mono">
          Parsing: {progress.currentFile}
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded">{error}</div>
      )}
    </div>
  );
};
