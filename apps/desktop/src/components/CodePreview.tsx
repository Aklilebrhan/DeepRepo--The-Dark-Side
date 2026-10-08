import React from 'react';
import { CodeBlock, Button } from '@deeprepo/ui-shared';
import { CodeChunk } from '@deeprepo/core';
import { TestTube2, HelpCircle, FileText } from 'lucide-react';

export interface CodePreviewProps {
  chunk: CodeChunk | null;
  onGenerateTests?: (chunk: CodeChunk) => void;
  onExplain?: (chunk: CodeChunk) => void;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ chunk, onGenerateTests, onExplain }) => {
  if (!chunk) {
    return (
      <div className="h-full border border-slate-800 rounded-xl bg-slate-900/50 p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <FileText size={36} className="mb-2 opacity-40 text-slate-400" />
        <h3 className="text-sm font-medium text-slate-400">No code snippet selected</h3>
        <p className="text-xs max-w-xs mt-1">
          Perform a semantic search or click on a chunk in search results to preview its AST source
          and actions.
        </p>
      </div>
    );
  }

  const m = chunk.metadata;

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900">
        <div>
          <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <span>{m.symbol_name}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
              {m.symbol_type}
            </span>
          </h3>
          <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs mt-0.5">
            {m.file_path}:{m.start_line}-{m.end_line}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onGenerateTests && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateTests(chunk)}
              title="Generate unit test suite for this symbol"
            >
              <TestTube2 size={13} className="text-blue-400" />
              <span>Generate Tests</span>
            </Button>
          )}

          {onExplain && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExplain(chunk)}
              title="Explain logic & dependencies"
            >
              <HelpCircle size={13} className="text-emerald-400" />
              <span>Explain</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <CodeBlock
          code={chunk.content}
          language={String(m.language)}
          filePath={m.file_path}
          startLine={m.start_line}
        />
      </div>
    </div>
  );
};
