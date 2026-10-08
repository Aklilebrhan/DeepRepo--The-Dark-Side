import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  filePath?: string;
  startLine?: number;
  highlightLines?: number[];
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  filePath,
  startLine = 1,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = code.split('\n');

  return (
    <div
      className={`rounded-lg overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs ${className}`}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-slate-400 select-none">
        <div className="flex items-center space-x-2">
          {filePath && <span className="font-semibold text-slate-300">{filePath}</span>}
          <span className="uppercase text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto p-3">
        <pre className="table w-full">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = startLine + idx;
              return (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="table-cell pr-3 text-right select-none text-slate-600 w-8">
                    {lineNum}
                  </td>
                  <td className="table-cell whitespace-pre text-slate-200">{line || '\n'}</td>
                </tr>
              );
            })}
          </tbody>
        </pre>
      </div>
    </div>
  );
};
