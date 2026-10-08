import React, { useState } from 'react';
import { Settings, RefreshCw, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@deeprepo/ui-shared';

export interface SettingsPanelProps {
  ollamaHost: string;
  selectedModel: string;
  isOllamaConnected: boolean;
  onSaveSettings: (host: string, model: string) => void;
  onResetIndex: () => void;
  onCheckConnection: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  ollamaHost,
  selectedModel,
  isOllamaConnected,
  onSaveSettings,
  onResetIndex,
  onCheckConnection,
}) => {
  const [host, setHost] = useState(ollamaHost);
  const [model, setModel] = useState(selectedModel);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(host, model);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl max-w-lg mx-auto">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800 text-slate-100 font-semibold text-sm">
        <Settings size={18} className="text-emerald-400" />
        <span>Local System Settings & Offline Models</span>
      </div>

      <form onSubmit={handleSave} className="space-y-4 mt-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Local Ollama Server Host
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              placeholder="http://localhost:11434"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCheckConnection}
              title="Test connection"
            >
              <RefreshCw size={13} />
              <span>Test</span>
            </Button>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {isOllamaConnected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Ollama Connected & Operational
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle size={12} /> Cannot connect to Ollama (ensure 'ollama serve' is
                running)
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Local Inference Model (Offline)
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
          >
            <option value="mistral:7b">mistral:7b (Recommended, 4-bit quantized)</option>
            <option value="llama2:7b">llama2:7b (Compact, low memory)</option>
            <option value="codellama:7b">codellama:7b (Specialized code model)</option>
            <option value="qwen2.5-coder:7b">qwen2.5-coder:7b (Coding specialist)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Local Vector Embedding Model
          </label>
          <input
            type="text"
            disabled
            value="nomic-ai/nomic-embed-text-v1.5 (ONNX CPU/GPU Local)"
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Optimized 384-dimensional code embeddings running in-process via ONNX Runtime.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onResetIndex}
            title="Purge local vector database and restart indexing"
          >
            <Trash2 size={13} />
            <span>Reset Index</span>
          </Button>

          <Button type="submit" variant="primary" size="sm">
            {isSaved ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};
