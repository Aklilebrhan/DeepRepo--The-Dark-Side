import { Sparkles, FileCode } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { SearchResult } from '@deeprepo/core';

export interface SearchResultsProps {
  onSelectChunk?: (chunk: SearchResult['chunk']) => void;
  onExplainChunk?: (chunk: SearchResult['chunk']) => void;
  onGenerateTestChunk?: (chunk: SearchResult['chunk']) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  onSelectChunk,
  onExplainChunk,
  onGenerateTestChunk,
}) => {
  const { results, isSearching, selectedChunk, setSelectedChunk } = useSearch();

  if (isSearching) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 mx-auto mb-2 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Searching codebase embeddings...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles size={14} className="text-emerald-400" />
          Semantic Search Results ({results.length})
        </span>
        <span className="text-[11px] text-slate-500">Ranked by Cosine Similarity</span>
      </div>

      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {results.map((res, idx) => {
          const m = res.chunk.metadata;
          const isSelected = selectedChunk?.id === res.chunk.id;
          const scorePercent = Math.round(res.score * 100);

          return (
            <div
              key={res.chunk.id || idx}
              onClick={() => {
                setSelectedChunk(res.chunk);
                onSelectChunk?.(res.chunk);
              }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-mono text-emerald-400 truncate max-w-[70%]">
                  <FileCode size={13} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{m.file_path}</span>
                  <span className="text-slate-500">
                    :{m.start_line}-{m.end_line}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    {m.symbol_type}: {m.symbol_name}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      scorePercent > 80
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : scorePercent > 60
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {scorePercent}% match
                  </span>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded text-[11px] font-mono text-slate-300 overflow-x-auto max-h-24 border border-slate-900">
                <pre>{res.chunk.content.slice(0, 300)}...</pre>
              </div>

              <div className="mt-2.5 flex items-center justify-end gap-2 text-xs">
                {onExplainChunk && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExplainChunk(res.chunk);
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 hover:underline"
                  >
                    Explain Code
                  </button>
                )}
                {onGenerateTestChunk && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateTestChunk(res.chunk);
                    }}
                    className="text-[11px] text-slate-400 hover:text-blue-400 hover:underline"
                  >
                    Generate Tests
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
